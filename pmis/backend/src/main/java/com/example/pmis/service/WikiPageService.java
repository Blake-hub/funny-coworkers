package com.example.pmis.service;

import com.example.pmis.dto.CreateWikiPageRequest;
import com.example.pmis.dto.UpdateWikiPageRequest;
import com.example.pmis.dto.WikiPageDTO;
import com.example.pmis.entity.Notification;
import com.example.pmis.entity.User;
import com.example.pmis.entity.WikiFolder;
import com.example.pmis.entity.WikiPage;
import com.example.pmis.entity.enumeration.WikiVisibility;
import com.example.pmis.repository.UserRepository;
import com.example.pmis.repository.WikiFolderRepository;
import com.example.pmis.repository.WikiPageRepository;
import com.example.pmis.util.MentionExtractor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WikiPageService {

    private final WikiPageRepository wikiPageRepository;
    private final UserRepository userRepository;
    private final WikiFolderRepository wikiFolderRepository;
    private final PermissionService permissionService;
    private final NotificationService notificationService;

    private static final Pattern MENTION_LIKE_MARKER = Pattern.compile(
            "(?i)@|class\\s*=\\s*([\"'])[^\"']*\\bmention\\b|data-type\\s*=\\s*([\"'])mention"
    );

    private static boolean looksLikeItContainsMentions(String html) {
        if (html == null || html.isBlank()) return false;
        return MENTION_LIKE_MARKER.matcher(html).find();
    }

    private static String snippet(String s, int max) {
        if (s == null) return "null";
        if (s.length() <= max) return s;
        return s.substring(0, max) + " ... [truncated, total " + s.length() + " chars]";
    }

    /**
     * Fires mention notifications after a page save.  Any failure during
     * notification creation is swallowed and logged — the page save MUST
     * succeed even if the notification pipeline is misbehaving.
     */
    private void afterSaveProduceMentions(WikiPage saved, User actor) {
        if (saved == null || actor == null) return;
        final Long pageId = saved.getId();
        final String contentHtml = saved.getContentHtml();
        final int contentLen = contentHtml == null ? -1 : contentHtml.length();
        try {
            final Set<Long> ids = MentionExtractor.extractUserIds(contentHtml);
            if (ids.isEmpty()) {
                if (looksLikeItContainsMentions(contentHtml)) {
                    log.warn(
                            "Page id={} saved with {} chars of content. HTML contains "
                          + "mention-like markup (@ or class='mention' or data-type='mention') "
                          + "but MentionExtractor extracted 0 user IDs — REGEX/RENDERER mismatch. "
                          + "Content snippet: {}",
                            pageId,
                            contentLen,
                            snippet(contentHtml, 500));
                } else if (log.isInfoEnabled()) {
                    log.info(
                            "Page id={} saved by actor id={} ({}): content.len={}, "
                          + "no mention markup detected (extracted ids empty)",
                            pageId, actor.getId(),
                            actor.getEmail() == null ? "?" : actor.getEmail().toLowerCase(Locale.ROOT),
                            contentLen);
                }
                return;
            }
            log.info(
                    "Page id={} saved by actor id={} ({}): content.len={}, "
                  + "extracted mention user IDs={} — calling notifyWikiMentions",
                    pageId,
                    actor.getId(),
                    actor.getEmail() == null ? "?" : actor.getEmail().toLowerCase(Locale.ROOT),
                    contentLen,
                    ids);

            final List<Notification> created =
                    notificationService.notifyWikiMentions(saved, ids, actor);

            log.info(
                    "notifyWikiMentions for page id={} completed: {} notification "
                  + "records persisted (actor={}, mentions={})",
                    pageId,
                    created == null ? 0 : created.size(),
                    actor.getId(),
                    ids);
        } catch (RuntimeException ex) {
            log.warn("Failed to produce mention notifications for page id={}: {}",
                    saved.getId(), ex.getMessage(), ex);
        }
    }

    @Transactional(readOnly = true)
    public List<WikiPageDTO> getAllWikiPages(Optional<Long> folderIdOpt, User currentUser) {
        List<WikiPage> pages;
        if (folderIdOpt.isPresent()) {
            Long folderId = folderIdOpt.get();
            pages = wikiPageRepository.findByFolderId(folderId).stream()
                    .filter(p -> hasViewAccess(p, currentUser))
                    .collect(Collectors.toList());
        } else {
            pages = wikiPageRepository.findAll().stream()
                    .filter(p -> hasViewAccess(p, currentUser))
                    .collect(Collectors.toList());
        }
        return pages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WikiPageDTO getWikiPageById(Long id, User currentUser) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));
        if (!hasViewAccess(wikiPage, currentUser)) {
            throw new RuntimeException("Access denied to wiki page with id: " + id);
        }
        return convertToDTO(wikiPage);
    }

    @Transactional(readOnly = true)
    public String getWikiPageHtml(Long id, User currentUser) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));
        if (!hasViewAccess(wikiPage, currentUser)) {
            throw new RuntimeException("Access denied to wiki page with id: " + id);
        }
        return wikiPage.getContentHtml();
    }

    private void validateTitleUniqueGlobally(String title, Long excludePageId) {
        if (title == null) return;
        final String trimmed = title.trim();
        if (trimmed.isEmpty()) return;
        final long safePageId = excludePageId != null ? excludePageId : -1L;
        final List<WikiPage> conflictingPages = wikiPageRepository.findConflictingByTitleGlobally(trimmed, safePageId);
        final List<WikiFolder> conflictingFolders = wikiFolderRepository.findConflictingByNameGlobally(trimmed, -1L);
        if (!conflictingPages.isEmpty() || !conflictingFolders.isEmpty()) {
            String conflictType = conflictingPages.isEmpty() ? "folder" : conflictingFolders.isEmpty() ? "document" : "folder or document";
            throw new RuntimeException("Title '" + trimmed + "' is already in use by another " + conflictType + " in the wiki module. Names must be unique across all folders and documents.");
        }
    }

    @Transactional
    public WikiPageDTO createWikiPage(CreateWikiPageRequest request, User currentUser) {
        Long teamId = request.getTeamId();
        if (request.getFolderId() != null && teamId == null) {
            Optional<WikiFolder> folderOpt = wikiFolderRepository.findById(request.getFolderId());
            if (folderOpt.isPresent() && folderOpt.get().getTeamId() != null) {
                teamId = folderOpt.get().getTeamId();
            }
        }

        validateTitleUniqueGlobally(request.getTitle(), null);

        WikiPage wikiPage = WikiPage.builder()
                .title(request.getTitle())
                .contentHtml(request.getContentHtml())
                .contentJson(request.getContentJson())
                .parentPageId(request.getParentPageId())
                .folderId(request.getFolderId())
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : false)
                .teamId(teamId)
                .createdBy(currentUser.getId())
                .lastModifiedBy(currentUser.getId())
                .build();

        WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);
        afterSaveProduceMentions(savedWikiPage, currentUser);
        return convertToDTO(savedWikiPage);
    }

    @Transactional
    public WikiPageDTO updateWikiPage(Long id, UpdateWikiPageRequest request, User currentUser) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));

        if (!hasEditAccess(wikiPage, currentUser)) {
            throw new RuntimeException("No edit access to wiki page with id: " + id);
        }

        if (request.getTitle() != null) {
            wikiPage.setTitle(request.getTitle());
        }
        if (request.getContentHtml() != null) {
            wikiPage.setContentHtml(request.getContentHtml());
        }
        if (request.getContentJson() != null) {
            wikiPage.setContentJson(request.getContentJson());
        }
        if (request.getParentPageId() != null) {
            wikiPage.setParentPageId(request.getParentPageId());
        }
        if (request.getFolderId() != null) {
            wikiPage.setFolderId(request.getFolderId());
            if (request.getTeamId() == null) {
                Optional<WikiFolder> folderOpt = wikiFolderRepository.findById(request.getFolderId());
                if (folderOpt.isPresent() && folderOpt.get().getTeamId() != null) {
                    wikiPage.setTeamId(folderOpt.get().getTeamId());
                }
            }
        }
        if (request.getIsPublished() != null) {
            wikiPage.setIsPublished(request.getIsPublished());
        }
        if (request.getTeamId() != null) {
            wikiPage.setTeamId(request.getTeamId());
        }

        wikiPage.setLastModifiedBy(currentUser.getId());

        if (request.getTitle() != null) {
            validateTitleUniqueGlobally(wikiPage.getTitle(), wikiPage.getId());
        }

        WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);
        afterSaveProduceMentions(savedWikiPage, currentUser);
        return convertToDTO(savedWikiPage);
    }

    @Transactional
    public WikiPageDTO publishWikiPage(Long id, User currentUser) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));

        if (!hasEditAccess(wikiPage, currentUser)) {
            throw new RuntimeException("No edit access to wiki page with id: " + id);
        }

        final boolean wasPublished = Boolean.TRUE.equals(wikiPage.getIsPublished());
        wikiPage.setIsPublished(true);
        wikiPage.setLastModifiedBy(currentUser.getId());

        WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);

        // Even though the content hasn't changed in this call, publishing is the
        // moment recipients expect to be notified about @mentions.  For pages that
        // were saved as a draft (and thus already had mention extraction run) we
        // rely on the dedup logic in notifyWikiMentions to avoid double-sending.
        if (!wasPublished) {
            log.info(
                    "publishWikiPage: publishing page id={} for the first time (actor={} / {}) — "
                  + "running afterSaveProduceMentions to catch any draft-saved mentions.",
                    id,
                    currentUser.getId(),
                    currentUser.getEmail() == null ? "?" : currentUser.getEmail().toLowerCase(Locale.ROOT));
            afterSaveProduceMentions(savedWikiPage, currentUser);
        } else {
            log.debug(
                    "publishWikiPage: page id={} was already published, skipping re-extract",
                    id);
        }

        return convertToDTO(savedWikiPage);
    }

    @Transactional
    public void deleteWikiPage(Long id, User currentUser) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));
        if (!hasEditAccess(wikiPage, currentUser)) {
            throw new RuntimeException("No edit access to wiki page with id: " + id);
        }
        wikiPageRepository.deleteById(id);
    }

    public boolean hasViewAccess(WikiPage page, User user) {
        if (page == null || user == null) {
            return false;
        }
        if (permissionService.isAdmin(user)) {
            return true;
        }

        if (page.getFolderId() != null) {
            Optional<WikiFolder> folderOpt = wikiFolderRepository.findById(page.getFolderId());
            if (folderOpt.isPresent()) {
                WikiFolder folder = folderOpt.get();
                WikiVisibility visibility = folder.getVisibility() != null ? folder.getVisibility() : WikiVisibility.PRIVATE;
                switch (visibility) {
                    case PUBLIC:
                        return true;
                    case PRIVATE:
                        return Objects.equals(folder.getCreatedBy(), user.getId())
                                || Objects.equals(page.getCreatedBy(), user.getId());
                    case TEAM:
                        if (folder.getTeamId() != null) {
                            return permissionService.isTeamMember(user, folder.getTeamId())
                                    || permissionService.isTeamOwner(user, folder.getTeamId())
                                    || Objects.equals(page.getCreatedBy(), user.getId());
                        }
                        return Objects.equals(page.getCreatedBy(), user.getId());
                    default:
                        return false;
                }
            }
        }

        if (Objects.equals(page.getCreatedBy(), user.getId())) {
            return true;
        }
        if (page.getTeamId() == null) {
            return true;
        }
        return permissionService.isTeamMember(user, page.getTeamId())
                || permissionService.isTeamOwner(user, page.getTeamId());
    }

    public boolean hasEditAccess(WikiPage page, User user) {
        if (page == null || user == null) {
            return false;
        }
        if (permissionService.isAdmin(user)) {
            return true;
        }

        if (page.getFolderId() != null) {
            Optional<WikiFolder> folderOpt = wikiFolderRepository.findById(page.getFolderId());
            if (folderOpt.isPresent()) {
                WikiFolder folder = folderOpt.get();
                if (Objects.equals(folder.getCreatedBy(), user.getId())) {
                    return true;
                }
                WikiVisibility visibility = folder.getVisibility() != null ? folder.getVisibility() : WikiVisibility.PRIVATE;
                if (visibility == WikiVisibility.TEAM && folder.getTeamId() != null) {
                    if (permissionService.isTeamOwner(user, folder.getTeamId())) {
                        return true;
                    }
                }
            }
        }

        if (Objects.equals(page.getCreatedBy(), user.getId())) {
            return true;
        }
        if (page.getTeamId() != null && permissionService.isTeamOwner(user, page.getTeamId())) {
            return true;
        }
        return false;
    }

    private WikiPageDTO convertToDTO(WikiPage wikiPage) {
        WikiPageDTO.WikiPageDTOBuilder builder = WikiPageDTO.builder()
                .id(wikiPage.getId())
                .title(wikiPage.getTitle())
                .contentHtml(wikiPage.getContentHtml())
                .contentJson(wikiPage.getContentJson())
                .parentPageId(wikiPage.getParentPageId())
                .folderId(wikiPage.getFolderId())
                .isPublished(wikiPage.getIsPublished())
                .teamId(wikiPage.getTeamId())
                .createdBy(wikiPage.getCreatedBy())
                .lastModifiedBy(wikiPage.getLastModifiedBy())
                .lastModifiedAt(wikiPage.getLastModifiedAt());

        if (wikiPage.getCreatedBy() != null) {
            userRepository.findById(wikiPage.getCreatedBy())
                    .ifPresent(user -> builder.createdByName(user.getName()));
        }

        if (wikiPage.getLastModifiedBy() != null) {
            userRepository.findById(wikiPage.getLastModifiedBy())
                    .ifPresent(user -> builder.lastModifiedByName(user.getName()));
        }

        return builder.build();
    }
}
