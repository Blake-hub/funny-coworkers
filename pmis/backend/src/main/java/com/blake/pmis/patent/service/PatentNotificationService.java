package com.blake.pmis.patent.service;

import com.blake.pmis.entity.Notification;
import com.blake.pmis.entity.User;
import com.blake.pmis.patent.entity.PatentApplication;
import com.blake.pmis.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * In-app notifications for the patent module, reusing the existing
 * notification table (bell icon + 30s polling on the frontend).
 */
@Service
@RequiredArgsConstructor
public class PatentNotificationService {

    public static final String TARGET_TYPE_PATENT = "PATENT";
    public static final String TYPE_PATENT_SUBMITTED = "PATENT_SUBMITTED";
    public static final String TYPE_PATENT_STATUS_CHANGED = "PATENT_STATUS_CHANGED";
    public static final String TYPE_PATENT_COMMENT = "PATENT_COMMENT";
    public static final String TYPE_PATENT_UPDATED = "PATENT_UPDATED";

    private final NotificationRepository notificationRepository;

    /** New application submitted: notify all patent admins (skip the actor). */
    @Transactional
    public void notifySubmitted(PatentApplication patent, User actor, List<Long> adminUserIds) {
        final List<Notification> toSave = adminUserIds.stream()
                .filter(id -> id != null && !id.equals(actor.getId()))
                .map(id -> Notification.builder()
                        .userId(id)
                        .type(TYPE_PATENT_SUBMITTED)
                        .targetType(TARGET_TYPE_PATENT)
                        .targetId(patent.getId())
                        .actorUserId(actor.getId())
                        .readStatus(false)
                        .build())
                .toList();
        if (!toSave.isEmpty()) {
            notificationRepository.saveAll(toSave);
        }
    }

    /** Status changed / undone by a patent admin: notify the creator. */
    @Transactional
    public void notifyStatusChanged(PatentApplication patent, User actor) {
        if (patent.getCreatorId() == null || patent.getCreatorId().equals(actor.getId())) {
            return;
        }
        notificationRepository.save(Notification.builder()
                .userId(patent.getCreatorId())
                .type(TYPE_PATENT_STATUS_CHANGED)
                .targetType(TARGET_TYPE_PATENT)
                .targetId(patent.getId())
                .actorUserId(actor.getId())
                .readStatus(false)
                .build());
    }

    /** Creator edited or withdrew a submitted application: notify all patent admins. */
    @Transactional
    public void notifyUpdated(PatentApplication patent, User actor, List<Long> adminUserIds) {
        final List<Notification> toSave = adminUserIds.stream()
                .filter(id -> id != null && !id.equals(actor.getId()))
                .map(id -> Notification.builder()
                        .userId(id)
                        .type(TYPE_PATENT_UPDATED)
                        .targetType(TARGET_TYPE_PATENT)
                        .targetId(patent.getId())
                        .actorUserId(actor.getId())
                        .readStatus(false)
                        .build())
                .toList();
        if (!toSave.isEmpty()) {
            notificationRepository.saveAll(toSave);
        }
    }

    /**
     * Manual comment: admin comment notifies the creator;
     * creator (or any non-admin) comment notifies all patent admins.
     */
    @Transactional
    public void notifyComment(PatentApplication patent, User actor,
                              boolean actorIsPatentAdmin, List<Long> adminUserIds) {
        if (actorIsPatentAdmin) {
            if (patent.getCreatorId() == null || patent.getCreatorId().equals(actor.getId())) {
                return;
            }
            notificationRepository.save(Notification.builder()
                    .userId(patent.getCreatorId())
                    .type(TYPE_PATENT_COMMENT)
                    .targetType(TARGET_TYPE_PATENT)
                    .targetId(patent.getId())
                    .actorUserId(actor.getId())
                    .readStatus(false)
                    .build());
        } else {
            final List<Notification> toSave = adminUserIds.stream()
                    .filter(id -> id != null && !id.equals(actor.getId()))
                    .map(id -> Notification.builder()
                            .userId(id)
                            .type(TYPE_PATENT_COMMENT)
                            .targetType(TARGET_TYPE_PATENT)
                            .targetId(patent.getId())
                            .actorUserId(actor.getId())
                            .readStatus(false)
                            .build())
                    .toList();
            if (!toSave.isEmpty()) {
                notificationRepository.saveAll(toSave);
            }
        }
    }
}
