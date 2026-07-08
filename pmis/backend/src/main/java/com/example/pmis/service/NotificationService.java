package com.example.pmis.service;

import com.example.pmis.dto.NotificationDTO;
import com.example.pmis.entity.Notification;
import com.example.pmis.entity.User;
import com.example.pmis.entity.WikiPage;
import com.example.pmis.repository.NotificationRepository;
import com.example.pmis.repository.UserRepository;
import com.example.pmis.repository.WikiPageRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    public static final String TYPE_WIKI_MENTION = "WIKI_MENTION";
    public static final String TARGET_TYPE_WIKI_PAGE = "WIKI_PAGE";

    private static final int MAX_LIMIT = 50;
    private static final int DEFAULT_LIMIT = 30;

    private final NotificationRepository notificationRepository;
    private final WikiPageRepository wikiPageRepository;
    private final UserRepository userRepository;

    @Transactional
    public List<Notification> notifyWikiMentions(WikiPage savedPage, Set<Long> mentionedUserIds, User actor) {
        if (mentionedUserIds == null || mentionedUserIds.isEmpty()
                || savedPage == null || savedPage.getId() == null
                || actor == null || actor.getId() == null) {
            return Collections.emptyList();
        }
        final Long actorId = actor.getId();
        final Long pageId = savedPage.getId();
        final List<Notification> toSave = new ArrayList<>(Math.max(1, mentionedUserIds.size()));
        for (Long recipientId : mentionedUserIds) {
            if (recipientId == null) continue;
            if (Objects.equals(recipientId, actorId)) continue; // skip self
            final Notification existing = notificationRepository
                    .findOneByUserIdAndTargetTypeAndTargetIdAndActorUserIdAndType(
                            recipientId, TARGET_TYPE_WIKI_PAGE, pageId, actorId, TYPE_WIKI_MENTION)
                    .orElse(null);
            if (existing != null) {
                existing.setCreatedAt(LocalDateTime.now());
                existing.setReadStatus(false);
                toSave.add(existing);
            } else {
                toSave.add(Notification.builder()
                        .userId(recipientId)
                        .type(TYPE_WIKI_MENTION)
                        .targetType(TARGET_TYPE_WIKI_PAGE)
                        .targetId(pageId)
                        .actorUserId(actorId)
                        .readStatus(false)
                        .build());
            }
        }
        if (toSave.isEmpty()) return Collections.emptyList();
        return notificationRepository.saveAll(toSave);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> listDtosForUser(User user, int limit) {
        if (user == null || user.getId() == null) return Collections.emptyList();
        final int clamped = Math.max(1, Math.min(MAX_LIMIT, limit <= 0 ? DEFAULT_LIMIT : limit));
        final Page<Notification> page = notificationRepository.findByUserId(
                user.getId(),
                PageRequest.of(0, clamped, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        final List<Notification> rows = page.getContent();
        if (rows.isEmpty()) return Collections.emptyList();

        final Set<Long> pageIds = new LinkedHashSet<>();
        final Set<Long> actorIds = new LinkedHashSet<>();
        for (Notification r : rows) {
            if (TYPE_WIKI_MENTION.equals(r.getType())
                    && TARGET_TYPE_WIKI_PAGE.equals(r.getTargetType())
                    && r.getTargetId() != null) {
                pageIds.add(r.getTargetId());
            }
            if (r.getActorUserId() != null) actorIds.add(r.getActorUserId());
        }

        final Map<Long, WikiPage> pageMap = pageIds.isEmpty()
                ? Collections.emptyMap()
                : wikiPageRepository.findAllById(pageIds).stream()
                        .collect(Collectors.toMap(WikiPage::getId, Function.identity()));
        final Map<Long, User> actorMap = actorIds.isEmpty()
                ? Collections.emptyMap()
                : userRepository.findAllById(actorIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));

        final List<NotificationDTO> out = new ArrayList<>(rows.size());
        for (Notification r : rows) {
            final String title;
            final String actionUrl;
            if (TYPE_WIKI_MENTION.equals(r.getType()) && TARGET_TYPE_WIKI_PAGE.equals(r.getTargetType())) {
                final WikiPage p = r.getTargetId() != null ? pageMap.get(r.getTargetId()) : null;
                final User a = r.getActorUserId() != null ? actorMap.get(r.getActorUserId()) : null;
                final String pageTitle = p != null && p.getTitle() != null && !p.getTitle().isBlank()
                        ? p.getTitle() : "a deleted wiki page";
                final String actorName = a != null && a.getName() != null && !a.getName().isBlank()
                        ? a.getName() : "A user";
                title = actorName + " mentioned you in \"" + pageTitle + "\"";
                actionUrl = p != null ? ("/wiki/" + p.getId()) : "/wiki";
            } else {
                // Fallback for any notification types added later in the UI
                title = "New notification (type: " + r.getType() + ")";
                actionUrl = "/";
            }
            out.add(NotificationDTO.builder()
                    .id(r.getId())
                    .type(r.getType())
                    .readStatus(r.getReadStatus())
                    .createdAt(r.getCreatedAt())
                    .title(title)
                    .actionUrl(actionUrl)
                    .build());
        }
        return out;
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        if (user == null || user.getId() == null) return 0L;
        return notificationRepository.countByUserIdAndReadStatus(user.getId(), false);
    }

    @Transactional
    public void markRead(Long notificationId, User user) {
        if (notificationId == null || user == null || user.getId() == null) return;
        final Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found: " + notificationId));
        if (!Objects.equals(n.getUserId(), user.getId())) {
            throw new EntityNotFoundException("Notification not found: " + notificationId);
        }
        if (Boolean.TRUE.equals(n.getReadStatus())) return;
        n.setReadStatus(true);
        notificationRepository.save(n);
    }

    @Transactional
    public int markAllRead(User user) {
        if (user == null || user.getId() == null) return 0;
        return notificationRepository.markAllAsReadForUserId(user.getId());
    }
}
