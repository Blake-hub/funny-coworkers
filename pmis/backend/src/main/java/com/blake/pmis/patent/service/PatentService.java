package com.blake.pmis.patent.service;

import com.blake.pmis.entity.User;
import com.blake.pmis.patent.dto.AllowedTransitionDTO;
import com.blake.pmis.patent.dto.PatentAttachmentDTO;
import com.blake.pmis.patent.dto.PatentCommentDTO;
import com.blake.pmis.patent.dto.PatentDetailDTO;
import com.blake.pmis.patent.dto.PatentHistoryDTO;
import com.blake.pmis.patent.dto.PatentListDTO;
import com.blake.pmis.patent.entity.PatentApplication;
import com.blake.pmis.patent.entity.PatentAttachment;
import com.blake.pmis.patent.entity.PatentComment;
import com.blake.pmis.patent.entity.PatentStatusHistory;
import com.blake.pmis.entity.enumeration.PatentAttachmentCategory;
import com.blake.pmis.entity.enumeration.PatentCategory;
import com.blake.pmis.entity.enumeration.PatentStatus;
import com.blake.pmis.entity.enumeration.PatentType;
import com.blake.pmis.patent.repository.PatentApplicationRepository;
import com.blake.pmis.patent.repository.PatentAttachmentRepository;
import com.blake.pmis.patent.repository.PatentCommentRepository;
import com.blake.pmis.patent.repository.PatentStatusHistoryRepository;
import com.blake.pmis.repository.UserRepository;
import com.blake.pmis.util.PatentStateMachine;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatentService {

    private static final long MAX_FILE_SIZE = 100L * 1024 * 1024; // 100MB
    private static final String[] DISCLOSURE_EXTENSIONS = {".doc", ".docx"};
    private static final String[] NOTICE_EXTENSIONS = {
            ".zip", ".rar", ".7z", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"};

    /** Chinese status names for system-generated comment records (data, not UI copy). */
    private static final Map<PatentStatus, String> STATUS_ZH = Map.ofEntries(
            Map.entry(PatentStatus.SUBMITTED, "已提交"),
            Map.entry(PatentStatus.RECEIVED, "已接收"),
            Map.entry(PatentStatus.CANCELLED, "已取消"),
            Map.entry(PatentStatus.PAID, "已付款"),
            Map.entry(PatentStatus.ACCEPTED, "已受理"),
            Map.entry(PatentStatus.PRELIMINARY_PASSED, "初审合格"),
            Map.entry(PatentStatus.PUBLISHED, "申请公布"),
            Map.entry(PatentStatus.PRIORITY_GRANTED, "予以优先"),
            Map.entry(PatentStatus.SUBSTANTIVE_EXAM, "实质审查"),
            Map.entry(PatentStatus.OA_RESPONSE, "意见答复"),
            Map.entry(PatentStatus.REGISTERING, "登记中"),
            Map.entry(PatentStatus.FEE_PAID, "已付授权费"),
            Map.entry(PatentStatus.GRANTED, "已获证"),
            Map.entry(PatentStatus.REJECTED, "驳回"),
            Map.entry(PatentStatus.DEEMED_WITHDRAWN, "视为撤回"),
            Map.entry(PatentStatus.WITHDRAWN, "主动撤回"));

    private final PatentApplicationRepository patentRepository;
    private final PatentStatusHistoryRepository historyRepository;
    private final PatentAttachmentRepository attachmentRepository;
    private final PatentCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final PatentAdminService patentAdminService;
    private final PatentNotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Path patentsRoot;

    @PostConstruct
    public void init() {
        this.patentsRoot = Paths.get(uploadDir, "patents");
        try {
            Files.createDirectories(patentsRoot);
        } catch (IOException e) {
            throw new RuntimeException("Could not create patent upload directory", e);
        }
    }

    // ---------------------------------------------------------------- list

    @Transactional(readOnly = true)
    public List<PatentListDTO> list(User viewer, String q, String scope) {
        final String keyword = (q == null || q.isBlank()) ? null : q.trim();
        final Long creatorId = "mine".equals(scope) ? viewer.getId() : null;
        final PatentStatus statusFilter = "granted".equals(scope) ? PatentStatus.GRANTED : null;

        final List<PatentApplication> patents = patentRepository.search(
                keyword != null,
                keyword == null ? "" : keyword,
                creatorId != null,
                creatorId == null ? 0L : creatorId,
                statusFilter != null,
                statusFilter == null ? PatentStatus.SUBMITTED : statusFilter);
        final Map<Long, User> creators = loadUsers(patents.stream()
                .map(PatentApplication::getCreatorId)
                .collect(Collectors.toSet()));
        return patents.stream()
                .map(p -> toListDTO(p, creators.get(p.getCreatorId())))
                .toList();
    }

    // ---------------------------------------------------------------- detail

    @Transactional(readOnly = true)
    public PatentDetailDTO getDetail(User viewer, Long id) {
        final PatentApplication patent = findPatent(id);
        final boolean viewerIsCreator = viewer.getId().equals(patent.getCreatorId());
        final boolean viewerIsAdmin = patentAdminService.isPatentAdmin(viewer);
        return buildDetail(patent, viewer, viewerIsCreator, viewerIsAdmin);
    }

    // ---------------------------------------------------------------- create

    @Transactional
    public PatentDetailDTO create(User creator, String title, List<String> inventors,
                                  MultipartFile disclosure, PatentCategory patentCategory) {
        final String cleanTitle = requireText(title, "Title is required");
        final List<String> names = cleanInventors(inventors);
        validateFile(disclosure, DISCLOSURE_EXTENSIONS, "Disclosure must be a .doc/.docx file");

        final PatentCategory category = patentCategory != null ? patentCategory : PatentCategory.INVENTION;
        final PatentApplication patent = patentRepository.save(PatentApplication.builder()
                .title(cleanTitle)
                .originalTitle(cleanTitle)
                // applicationType is intentionally left null until admin confirms at RECEIVED.
                .patentCategory(category)
                .status(PatentStatus.SUBMITTED)
                .inventors(toJson(names))
                .creatorId(creator.getId())
                .submitDate(LocalDate.now())
                .build());

        storeAttachment(patent.getId(), disclosure, PatentAttachmentCategory.DISCLOSURE, null, creator);

        // Record the initial SUBMITTED state so the status timeline is complete.
        historyRepository.save(PatentStatusHistory.builder()
                .patentId(patent.getId())
                .fromStatus(null)
                .toStatus(PatentStatus.SUBMITTED)
                .eventDate(patent.getSubmitDate())
                .operatorId(creator.getId())
                .build());

        notificationService.notifySubmitted(patent, creator, patentAdminService.patentAdminUserIds());
        return buildDetail(patent, creator, true, patentAdminService.isPatentAdmin(creator));
    }

    // ---------------------------------------------------------------- update (creator before RECEIVED, admin before ACCEPTED; title any status for admin)

    @Transactional
    public PatentDetailDTO update(User actor, Long id, String title, List<String> inventors,
                                  MultipartFile disclosure, PatentCategory patentCategory) {
        final PatentApplication patent = findPatent(id);
        final boolean actorIsAdmin = patentAdminService.isPatentAdmin(actor);

        // Category + inventors: creator only while WITHDRAWN (withdraw = pull back to edit;
        // SUBMITTED is locked to avoid racing the admin's reception), admin before ACCEPTED.
        final PatentStatus currentStatus = patent.getStatus();
        final boolean creatorWindow = actor.getId().equals(patent.getCreatorId())
                && currentStatus == PatentStatus.WITHDRAWN;
        final boolean categoryWindow = creatorWindow
                || (actorIsAdmin && currentStatus.ordinal() < PatentStatus.ACCEPTED.ordinal());

        // Title: creator while WITHDRAWN, admin in ANY status (agency rewrites).
        final boolean titleAllowed = creatorWindow || actorIsAdmin;

        if (!titleAllowed) {
            throw new AccessDeniedException("Editing the title is not allowed at this stage");
        }

        final String newTitle = requireText(title, "Title is required");
        final String oldTitle = patent.getTitle();
        boolean changedTitle = !newTitle.equals(oldTitle);

        patent.setTitle(newTitle);
        if (changedTitle && actorIsAdmin) {
            // Agency rewrites keep the original draft visible alongside the new title.
            patent.setOriginalTitle(patent.getOriginalTitle() == null ? oldTitle : patent.getOriginalTitle());
        }

        if (inventors != null && !inventors.isEmpty() && categoryWindow) {
            patent.setInventors(toJson(cleanInventors(inventors)));
        }

        if (patentCategory != null && categoryWindow
                && patentCategory != patent.getPatentCategory()) {
            final PatentCategory oldCat = patent.getPatentCategory();
            patent.setPatentCategory(patentCategory);
            commentRepository.save(PatentComment.builder()
                    .patentId(patent.getId())
                    .isSystem(true)
                    .authorId(actor.getId())
                    .content("专利类型由「" + labelOf(oldCat) + "」改为「" + labelOf(patentCategory) + "」")
                    .build());
        }

        if (disclosure != null && !disclosure.isEmpty()) {
            validateFile(disclosure, DISCLOSURE_EXTENSIONS, "Disclosure must be a .doc/.docx file");
            for (PatentAttachment old : attachmentRepository
                    .findByPatentIdAndHiddenFalseAndCategoryOrderByUploadedAtDescIdDesc(
                            id, PatentAttachmentCategory.DISCLOSURE)) {
                old.setHidden(true);
                attachmentRepository.save(old);
            }
            storeAttachment(id, disclosure, PatentAttachmentCategory.DISCLOSURE, null, actor);
        }

        if (changedTitle) {
            commentRepository.save(PatentComment.builder()
                    .patentId(patent.getId())
                    .isSystem(true)
                    .authorId(actor.getId())
                    .content("专利名称由「" + oldTitle + "」改为「" + newTitle + "」")
                    .build());
        }

        patentRepository.save(patent);
        notificationService.notifyUpdated(patent, actor, patentAdminService.patentAdminUserIds());
        return buildDetail(patent, actor, actor.getId().equals(patent.getCreatorId()), actorIsAdmin);
    }

    // ---------------------------------------------------------------- delete (creator/admin, WITHDRAWN only)

    @Transactional
    public void delete(User actor, Long id) {
        final PatentApplication patent = findPatent(id);
        final boolean actorIsAdmin = patentAdminService.isPatentAdmin(actor);
        if (!actor.getId().equals(patent.getCreatorId()) && !actorIsAdmin) {
            throw new AccessDeniedException("Only the creator or a patent admin can delete this application");
        }
        if (patent.getStatus() != PatentStatus.WITHDRAWN) {
            throw new IllegalStateException("Only withdrawn applications can be deleted");
        }
        // Best-effort removal of uploaded files on disk; DB rows cascade.
        final Path dir = patentsRoot.resolve(String.valueOf(id));
        try {
            if (Files.exists(dir)) {
                try (var stream = Files.walk(dir)) {
                    stream.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
                }
            }
        } catch (IOException ignored) {
            // Disk cleanup failure must not block the delete.
        }
        patentRepository.delete(patent);
    }

    private static String labelOf(PatentCategory c) {
        if (c == null) return "";
        return switch (c) {
            case INVENTION -> "发明专利";
            case UTILITY_MODEL -> "实用新型专利";
            case DESIGN -> "外观设计专利";
        };
    }

    // ---------------------------------------------------------------- transition (patent admin)

    @Transactional
    public PatentDetailDTO transition(User actor, Long id, PatentStatus toStatus, LocalDate eventDate,
                                      String applicationNumber, String certificateNumber,
                                      PatentType applicationType, MultipartFile file) {
        final PatentApplication patent = findPatent(id);
        final boolean actorIsAdmin = patentAdminService.isPatentAdmin(actor);
        final PatentStatus from = patent.getStatus();

        // Creator may withdraw while SUBMITTED, or resubmit after a withdrawal.
        // Admin transitions go through the state machine table.
        final boolean creatorResubmit = !actorIsAdmin
                && PatentStatus.SUBMITTED == toStatus
                && PatentStatus.WITHDRAWN == from
                && actor.getId().equals(patent.getCreatorId());
        if (!actorIsAdmin) {
            final boolean creatorWithdraw = PatentStatus.WITHDRAWN == toStatus
                    && PatentStatus.SUBMITTED == from
                    && actor.getId().equals(patent.getCreatorId());
            if (!creatorWithdraw && !creatorResubmit) {
                throw new AccessDeniedException("Only patent admins can change the status");
            }
        }

        if (!creatorResubmit && !PatentStateMachine.canTransition(patent.getApplicationType(), from, toStatus)) {
            throw new RuntimeException("Illegal status transition: " + from + " -> " + toStatus);
        }
        if (PatentStateMachine.requiresApplicationNumber(toStatus)
                && (applicationNumber == null || applicationNumber.isBlank())) {
            throw new RuntimeException("Application number is required for this transition");
        }
        if (PatentStateMachine.requiresCertificateNumber(toStatus)
                && (certificateNumber == null || certificateNumber.isBlank())) {
            throw new RuntimeException("Certificate number is required for this transition");
        }
        if (PatentStateMachine.requiresApplicationTypeConfirm(toStatus) && applicationType == null) {
            throw new RuntimeException("Application type confirmation is required for this transition");
        }
        if (PatentStateMachine.requiresNoticeAttachment(toStatus)
                && (file == null || file.isEmpty())) {
            throw new RuntimeException("An official notice attachment is required for this transition");
        }
        if (file != null && !file.isEmpty()) {
            validateFile(file, NOTICE_EXTENSIONS, "Unsupported attachment type");
        }

        final LocalDate date = eventDate != null ? eventDate : LocalDate.now();
        patent.setStatus(toStatus);
        applyStageDate(patent, toStatus, date);
        if (creatorResubmit) {
            // Resubmission refreshes the submission date.
            patent.setSubmitDate(date);
        }
        if (applicationNumber != null && !applicationNumber.isBlank()) {
            patent.setApplicationNumber(applicationNumber.trim());
        }
        if (certificateNumber != null && !certificateNumber.isBlank()) {
            patent.setCertificateNumber(certificateNumber.trim());
        }
        if (applicationType != null) {
            patent.setApplicationType(applicationType);
        }
        patentRepository.save(patent);

        final PatentStatusHistory history = historyRepository.save(PatentStatusHistory.builder()
                .patentId(patent.getId())
                .fromStatus(from)
                .toStatus(toStatus)
                .eventDate(date)
                .operatorId(actor.getId())
                .applicationNumber(patent.getApplicationNumber())
                .certificateNumber(patent.getCertificateNumber())
                .applicationType(toStatus == PatentStatus.PAID ? patent.getApplicationType() : null)
                .build());

        String attachmentName = null;
        if (file != null && !file.isEmpty()) {
            final PatentAttachmentCategory category = PatentStateMachine.requiresNoticeAttachment(toStatus)
                    ? PatentAttachmentCategory.NOTICE
                    : PatentAttachmentCategory.OTHER;
            storeAttachment(patent.getId(), file, category, history.getId(), actor);
            attachmentName = file.getOriginalFilename();
        }

        commentRepository.save(PatentComment.builder()
                .patentId(patent.getId())
                .isSystem(true)
                .content(buildTransitionComment(toStatus, date, patent, attachmentName))
                .build());

        if (actorIsAdmin) {
            notificationService.notifyStatusChanged(patent, actor);
        } else {
            // Creator withdraw: notify the patent admins instead.
            notificationService.notifyUpdated(patent, actor, patentAdminService.patentAdminUserIds());
        }
        return buildDetail(patent, actor, actor.getId().equals(patent.getCreatorId()), actorIsAdmin);
    }

    // ---------------------------------------------------------------- undo (patent admin, keeps audit trail)

    @Transactional
    public PatentDetailDTO undo(User actor, Long id) {
        if (!patentAdminService.isPatentAdmin(actor)) {
            throw new AccessDeniedException("Only patent admins can undo a transition");
        }
        final PatentApplication patent = findPatent(id);
        final PatentStatusHistory history = historyRepository
                .findFirstByPatentIdAndUndoneFalseOrderByCreatedAtDescIdDesc(id)
                .orElseThrow(() -> new RuntimeException("No transition to undo"));

        if (history.getFromStatus() == null) {
            throw new IllegalStateException("Cannot undo the initial submission");
        }

        final PatentStatus revertedTo = history.getFromStatus();
        patent.setStatus(revertedTo);
        clearStageDate(patent, history.getToStatus());
        if (history.getToStatus() == PatentStatus.ACCEPTED) {
            patent.setApplicationNumber(null);
        }
        if (history.getToStatus() == PatentStatus.GRANTED) {
            patent.setCertificateNumber(null);
        }
        if (history.getToStatus() == PatentStatus.PAID) {
            // PAID snapshot captured applicationType; if the admin undoes back to RECEIVED the
            // value must be retained (confirmed at RECEIVED step) — do NOT reset to STANDARD.
        }
        patentRepository.save(patent);

        history.setUndone(true);
        history.setUndoneAt(java.time.LocalDateTime.now());
        history.setUndoneBy(actor.getId());
        historyRepository.save(history);

        for (PatentAttachment att : attachmentRepository.findByHistoryId(history.getId())) {
            att.setHidden(true);
            attachmentRepository.save(att);
        }

        commentRepository.save(PatentComment.builder()
                .patentId(patent.getId())
                .isSystem(true)
                .content(buildUndoComment(history.getToStatus(), revertedTo))
                .build());

        notificationService.notifyStatusChanged(patent, actor);
        return buildDetail(patent, actor, actor.getId().equals(patent.getCreatorId()), true);
    }

    // ---------------------------------------------------------------- comments

    @Transactional
    public PatentDetailDTO addComment(User actor, Long id, String content) {
        final PatentApplication patent = findPatent(id);
        if (content == null || content.isBlank()) {
            throw new RuntimeException("Comment content is required");
        }
        commentRepository.save(PatentComment.builder()
                .patentId(id)
                .authorId(actor.getId())
                .isSystem(false)
                .content(content.trim())
                .build());
        notificationService.notifyComment(patent, actor,
                patentAdminService.isPatentAdmin(actor), patentAdminService.patentAdminUserIds());
        return buildDetail(patent, actor, actor.getId().equals(patent.getCreatorId()),
                patentAdminService.isPatentAdmin(actor));
    }

    // ---------------------------------------------------------------- attachment download

    @Transactional(readOnly = true)
    public AttachmentFile loadAttachmentFile(User viewer, Long patentId, Long attachmentId) {
        final PatentAttachment att = attachmentRepository
                .findByIdAndPatentIdAndHiddenFalse(attachmentId, patentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
        if (att.getCategory() == PatentAttachmentCategory.DISCLOSURE) {
            final boolean allowed = viewer.getId().equals(att.getUploadedBy())
                    || viewer.getId().equals(findPatent(patentId).getCreatorId())
                    || patentAdminService.isPatentAdmin(viewer);
            if (!allowed) {
                throw new AccessDeniedException("Disclosure is only visible to the creator and patent admins");
            }
        }
        final Path base = patentsRoot.toAbsolutePath().normalize();
        final Path path = base.resolve(att.getFilePath()).normalize();
        if (!path.startsWith(base) || !Files.exists(path)) {
            throw new RuntimeException("Attachment file missing");
        }
        return new AttachmentFile(path, att.getFileName(),
                att.getContentType() != null ? att.getContentType() : "application/octet-stream");
    }

    public record AttachmentFile(Path path, String fileName, String contentType) {
    }

    // ---------------------------------------------------------------- helpers

    private PatentApplication findPatent(Long id) {
        if (id == null) {
            throw new RuntimeException("Patent id is required");
        }
        return patentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patent not found: " + id));
    }

    private void applyStageDate(PatentApplication p, PatentStatus to, LocalDate date) {
        switch (to) {
            case RECEIVED -> p.setReceivedDate(date);
            case PAID -> p.setPaidDate(date);
            case ACCEPTED -> p.setAcceptedDate(date);
            case PRELIMINARY_PASSED -> p.setPreliminaryPassedDate(date);
            case PUBLISHED -> p.setPublishedDate(date);
            case PRIORITY_GRANTED -> p.setPriorityGrantedDate(date);
            case SUBSTANTIVE_EXAM -> p.setSubstantiveExamDate(date);
            case OA_RESPONSE -> p.setOaNotificationDate(date);
            case FEE_PAID -> p.setGrantFeePaidDate(date);
            case GRANTED -> p.setGrantedDate(date);
            default -> {
                // CANCELLED / REJECTED / DEEMED_WITHDRAWN / WITHDRAWN: history only.
            }
        }
    }

    private void clearStageDate(PatentApplication p, PatentStatus to) {
        applyStageDate(p, to, null);
    }

    private void storeAttachment(Long patentId, MultipartFile file,
                                 PatentAttachmentCategory category, Long historyId, User uploader) {
        final String original = file.getOriginalFilename();
        final String extension = extensionOf(original);
        final String storedName = UUID.randomUUID() + extension;
        final Path dir = patentsRoot.resolve(String.valueOf(patentId));
        try {
            Files.createDirectories(dir);
            final Path target = dir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            attachmentRepository.save(PatentAttachment.builder()
                    .patentId(patentId)
                    .historyId(historyId)
                    .category(category)
                    .fileName(original != null ? original : storedName)
                    .filePath(patentsRoot.relativize(target).toString().replace('\\', '/'))
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .uploadedBy(uploader.getId())
                    .build());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store attachment: " + e.getMessage(), e);
        }
    }

    private void validateFile(MultipartFile file, String[] allowedExtensions, String errorMessage) {
        if (file == null) {
            throw new RuntimeException(errorMessage);
        }
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds the maximum limit of 100MB");
        }
        final String extension = extensionOf(file.getOriginalFilename());
        for (String allowed : allowedExtensions) {
            if (allowed.equals(extension)) {
                return;
            }
        }
        throw new RuntimeException(errorMessage);
    }

    private String extensionOf(String filename) {
        if (filename == null) {
            return "";
        }
        final int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot).toLowerCase(Locale.ROOT) : "";
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }
        return value.trim();
    }

    private List<String> cleanInventors(List<String> inventors) {
        if (inventors == null) {
            throw new RuntimeException("At least one inventor is required");
        }
        final List<String> names = inventors.stream()
                .filter(n -> n != null && !n.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        if (names.isEmpty()) {
            throw new RuntimeException("At least one inventor is required");
        }
        return names;
    }

    private String toJson(List<String> inventors) {
        try {
            return objectMapper.writeValueAsString(inventors);
        } catch (IOException e) {
            throw new RuntimeException("Failed to serialize inventors", e);
        }
    }

    private List<String> fromJson(String inventors) {
        try {
            return objectMapper.readValue(inventors, new TypeReference<List<String>>() {
            });
        } catch (IOException e) {
            return List.of();
        }
    }

    private PatentDetailDTO buildDetail(PatentApplication patent, User viewer,
                                        boolean viewerIsCreator, boolean viewerIsAdmin) {
        final List<PatentAttachment> attachments =
                attachmentRepository.findByPatentIdAndHiddenFalseOrderByUploadedAtDescIdDesc(patent.getId());
        final List<PatentComment> comments =
                commentRepository.findByPatentIdOrderByCreatedAtDescIdDesc(patent.getId());
        final List<PatentStatusHistory> history =
                historyRepository.findByPatentIdOrderByCreatedAtDescIdDesc(patent.getId());

        final Set<Long> userIds = new LinkedHashSet<>();
        userIds.add(patent.getCreatorId());
        attachments.forEach(a -> userIds.add(a.getUploadedBy()));
        comments.forEach(c -> {
            if (c.getAuthorId() != null) {
                userIds.add(c.getAuthorId());
            }
        });
        history.forEach(h -> userIds.add(h.getOperatorId()));
        final Map<Long, User> users = loadUsers(userIds);

        // Disclosure rows are removed server-side for unauthorized viewers.
        final boolean canSeeDisclosure = viewerIsCreator || viewerIsAdmin;
        final List<PatentAttachmentDTO> attachmentDTOs = attachments.stream()
                .filter(a -> canSeeDisclosure || a.getCategory() != PatentAttachmentCategory.DISCLOSURE)
                .map(a -> PatentAttachmentDTO.builder()
                        .id(a.getId())
                        .category(a.getCategory().name())
                        .fileName(a.getFileName())
                        .fileSize(a.getFileSize())
                        .contentType(a.getContentType())
                        .uploadedBy(a.getUploadedBy())
                        .uploadedByName(nameOf(users.get(a.getUploadedBy())))
                        .uploadedAt(a.getUploadedAt())
                        .historyId(a.getHistoryId())
                        .build())
                .toList();

        final List<PatentCommentDTO> commentDTOs = comments.stream()
                .map(c -> PatentCommentDTO.builder()
                        .id(c.getId())
                        .isSystem(c.getIsSystem())
                        .authorId(c.getAuthorId())
                        .authorName(nameOf(users.get(c.getAuthorId())))
                        .content(c.getContent())
                        .createdAt(c.getCreatedAt())
                        .build())
                .toList();

        final List<PatentHistoryDTO> historyDTOs = history.stream()
                .map(h -> PatentHistoryDTO.builder()
                        .id(h.getId())
                        .fromStatus(h.getFromStatus() != null ? h.getFromStatus().name() : null)
                        .toStatus(h.getToStatus().name())
                        .eventDate(h.getEventDate())
                        .operatorId(h.getOperatorId())
                        .operatorName(nameOf(users.get(h.getOperatorId())))
                        .applicationNumber(h.getApplicationNumber())
                        .certificateNumber(h.getCertificateNumber())
                        .applicationType(h.getApplicationType() != null ? h.getApplicationType().name() : null)
                        .undone(h.getUndone())
                        .undoneAt(h.getUndoneAt())
                        .createdAt(h.getCreatedAt())
                        .build())
                .toList();

        return PatentDetailDTO.builder()
                .id(patent.getId())
                .title(patent.getTitle())
                .originalTitle(patent.getOriginalTitle())
                .inventors(fromJson(patent.getInventors()))
                .applicationType(patent.getApplicationType() != null ? patent.getApplicationType().name() : null)
                .patentCategory(patent.getPatentCategory().name())
                .status(patent.getStatus().name())
                .applicationNumber(patent.getApplicationNumber())
                .certificateNumber(patent.getCertificateNumber())
                .projectId(patent.getProjectId())
                .creatorId(patent.getCreatorId())
                .creatorName(nameOf(users.get(patent.getCreatorId())))
                .submitDate(patent.getSubmitDate())
                .receivedDate(patent.getReceivedDate())
                .paidDate(patent.getPaidDate())
                .acceptedDate(patent.getAcceptedDate())
                .preliminaryPassedDate(patent.getPreliminaryPassedDate())
                .publishedDate(patent.getPublishedDate())
                .priorityGrantedDate(patent.getPriorityGrantedDate())
                .substantiveExamDate(patent.getSubstantiveExamDate())
                .oaNotificationDate(patent.getOaNotificationDate())
                .grantFeePaidDate(patent.getGrantFeePaidDate())
                .grantedDate(patent.getGrantedDate())
                .createdAt(patent.getCreatedAt())
                .updatedAt(patent.getUpdatedAt())
                .viewerIsCreator(viewerIsCreator)
                .viewerIsPatentAdmin(viewerIsAdmin)
                .allowedTransitions(buildAllowedTransitions(patent, viewerIsCreator, viewerIsAdmin))
                .attachments(attachmentDTOs)
                .comments(commentDTOs)
                .history(historyDTOs)
                .build();
    }

    private List<AllowedTransitionDTO> buildAllowedTransitions(PatentApplication patent,
                                                               boolean viewerIsCreator,
                                                               boolean viewerIsAdmin) {
        final Set<PatentStatus> targets;
        if (viewerIsAdmin) {
            targets = PatentStateMachine.allowedTargets(patent.getApplicationType(), patent.getStatus());
        } else if (viewerIsCreator && patent.getStatus() == PatentStatus.SUBMITTED) {
            targets = Set.of(PatentStatus.WITHDRAWN);
        } else if (viewerIsCreator && patent.getStatus() == PatentStatus.WITHDRAWN) {
            targets = Set.of(PatentStatus.SUBMITTED);
        } else {
            targets = Set.of();
        }
        final List<AllowedTransitionDTO> out = new ArrayList<>(targets.size());
        for (PatentStatus to : targets) {
            out.add(AllowedTransitionDTO.builder()
                    .toStatus(to.name())
                    .requiresAttachment(PatentStateMachine.requiresNoticeAttachment(to))
                    .requiresApplicationNumber(PatentStateMachine.requiresApplicationNumber(to))
                    .requiresCertificateNumber(PatentStateMachine.requiresCertificateNumber(to))
                    .requiresApplicationTypeConfirm(PatentStateMachine.requiresApplicationTypeConfirm(to))
                    .build());
        }
        return out;
    }

    private PatentListDTO toListDTO(PatentApplication p, User creator) {
        return PatentListDTO.builder()
                .id(p.getId())
                .title(p.getTitle())
                .originalTitle(p.getOriginalTitle())
                .inventors(fromJson(p.getInventors()))
                .applicationType(p.getApplicationType() != null ? p.getApplicationType().name() : null)
                .patentCategory(p.getPatentCategory().name())
                .status(p.getStatus().name())
                .applicationNumber(p.getApplicationNumber())
                .certificateNumber(p.getCertificateNumber())
                .creatorId(p.getCreatorId())
                .creatorName(nameOf(creator))
                .submitDate(p.getSubmitDate())
                .receivedDate(p.getReceivedDate())
                .paidDate(p.getPaidDate())
                .acceptedDate(p.getAcceptedDate())
                .preliminaryPassedDate(p.getPreliminaryPassedDate())
                .publishedDate(p.getPublishedDate())
                .priorityGrantedDate(p.getPriorityGrantedDate())
                .substantiveExamDate(p.getSubstantiveExamDate())
                .oaNotificationDate(p.getOaNotificationDate())
                .grantFeePaidDate(p.getGrantFeePaidDate())
                .grantedDate(p.getGrantedDate())
                .build();
    }

    private Map<Long, User> loadUsers(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private String nameOf(User user) {
        return user != null && user.getName() != null ? user.getName() : null;
    }

    // ------------------------------------------------- system comment texts (Chinese, data not UI)

    private String buildTransitionComment(PatentStatus to, LocalDate date,
                                          PatentApplication patent, String attachmentName) {
        final StringBuilder sb = new StringBuilder(formatChineseDate(date)).append("，");
        switch (to) {
            case SUBMITTED -> sb.append("申请人重新提交了本申请");
            case RECEIVED -> sb.append("专利管理员已接收交底书并转交代理商");
            case CANCELLED -> sb.append("经代理商初审，本专利不具备申请价值，予以取消");
            case PAID -> sb.append("公司已支付代理费与官费，申请类型确认为")
                    .append(typeZh(patent.getApplicationType()));
            case ACCEPTED -> sb.append("国家知识产权局已下发《专利受理通知书》");
            case PRELIMINARY_PASSED -> sb.append("国家知识产权局已下发《发明专利申请初步审查合格通知书》");
            case PUBLISHED -> sb.append("国家知识产权局已下发《发明专利申请公布通知书》");
            case PRIORITY_GRANTED -> sb.append("国家知识产权局已下发《专利申请予以优先审查通知书》");
            case SUBSTANTIVE_EXAM -> sb.append("国家知识产权局已下发《发明专利申请进入实质审查阶段通知书》");
            case OA_RESPONSE -> sb.append("国家知识产权局已下发《审查意见通知书》");
            case REGISTERING -> sb.append("国家知识产权局已下发《办理登记手续通知书》");
            case FEE_PAID -> sb.append("公司已支付授权费");
            case GRANTED -> sb.append("国家知识产权局已下发专利证书");
            case REJECTED -> sb.append("国家知识产权局驳回本申请");
            case DEEMED_WITHDRAWN -> sb.append("本申请因未按期答复被视为撤回");
            case WITHDRAWN -> sb.append("本申请已主动撤回");
            default -> sb.append("状态变更为").append(STATUS_ZH.getOrDefault(to, to.name()));
        }
        if (to == PatentStatus.ACCEPTED && patent.getApplicationNumber() != null) {
            sb.append("（申请号：").append(patent.getApplicationNumber()).append("）");
        }
        if (to == PatentStatus.GRANTED && patent.getCertificateNumber() != null) {
            sb.append("（证书号：").append(patent.getCertificateNumber()).append("）");
        }
        if (attachmentName != null && !attachmentName.isBlank()) {
            sb.append("，附件：").append(attachmentName);
        }
        return sb.toString();
    }

    private String buildUndoComment(PatentStatus undoneTo, PatentStatus revertedTo) {
        return formatChineseDate(LocalDate.now()) + "，管理员撤销了“"
                + STATUS_ZH.getOrDefault(undoneTo, undoneTo.name())
                + "”状态变更，回退至“" + STATUS_ZH.getOrDefault(revertedTo, revertedTo.name()) + "”";
    }

    private String typeZh(PatentType type) {
        return switch (type) {
            case PRIORITY -> "优先审查";
            case PREEMPTIVE -> "预审新申请";
            default -> "发明专利新申请";
        };
    }

    private String formatChineseDate(LocalDate date) {
        return date.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG)
                .withLocale(Locale.CHINA));
    }
}
