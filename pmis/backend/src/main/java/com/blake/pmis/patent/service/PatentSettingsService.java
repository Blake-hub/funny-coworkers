package com.blake.pmis.patent.service;

import com.blake.pmis.dto.CreateWikiPageRequest;
import com.blake.pmis.dto.WikiPageDTO;
import com.blake.pmis.entity.User;
import com.blake.pmis.entity.WikiPage;
import com.blake.pmis.entity.enumeration.WikiVisibility;
import com.blake.pmis.patent.dto.PatentTemplateDTO;
import com.blake.pmis.patent.entity.PatentSetting;
import com.blake.pmis.patent.entity.PatentTemplate;
import com.blake.pmis.patent.repository.PatentSettingRepository;
import com.blake.pmis.patent.repository.PatentTemplateRepository;
import com.blake.pmis.repository.UserRepository;
import com.blake.pmis.repository.WikiPageRepository;
import com.blake.pmis.service.WikiPageService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Patent module settings: disclosure templates (upload/download/delete) and
 * the linked "patent writing guide" wiki page (Plan B-lite).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatentSettingsService {

    private static final long MAX_FILE_SIZE = 100L * 1024 * 1024; // 100MB
    private static final String[] TEMPLATE_EXTENSIONS = {".doc", ".docx"};
    private static final long PATENT_SETTING_ID = 1L;
    /** Default title for a newly created dedicated guide page (data, shown via wiki UI). */
    private static final String DEFAULT_GUIDE_TITLE = "专利撰写说明";

    private final PatentTemplateRepository templateRepository;
    private final PatentSettingRepository settingRepository;
    private final UserRepository userRepository;
    private final WikiPageService wikiPageService;
    private final WikiPageRepository wikiPageRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Path templatesRoot;

    @PostConstruct
    public void init() {
        this.templatesRoot = Paths.get(uploadDir, "patents", "templates");
        try {
            Files.createDirectories(templatesRoot);
        } catch (IOException e) {
            throw new RuntimeException("Could not create patent template upload directory", e);
        }
    }

    // ---------------------------------------------------------------- templates

    @Transactional(readOnly = true)
    public List<PatentTemplateDTO> listTemplates() {
        return templateRepository.findAllByOrderByUploadedAtDescIdDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PatentTemplateDTO uploadTemplate(MultipartFile file, User uploader) {
        validateTemplateFile(file);
        final String original = file.getOriginalFilename();
        final String extension = extensionOf(original);
        final String storedName = UUID.randomUUID() + extension;
        try {
            final Path target = templatesRoot.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            final PatentTemplate saved = templateRepository.save(PatentTemplate.builder()
                    .fileName(original != null ? original : storedName)
                    .storedPath(storedName)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .uploadedBy(uploader.getId())
                    .build());
            log.info("Patent template uploaded: id={} name={} by user id={}",
                    saved.getId(), saved.getFileName(), uploader.getId());
            return toDTO(saved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store template file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void deleteTemplate(Long id) {
        final PatentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));
        templateRepository.delete(template);
        // Best-effort disk cleanup; a missing file must not block the DB delete.
        try {
            Files.deleteIfExists(templatesRoot.resolve(template.getStoredPath()));
        } catch (IOException e) {
            log.warn("Failed to delete template file {} from disk: {}",
                    template.getStoredPath(), e.getMessage());
        }
    }

    /** Loads a template file for download; path traversal safe. */
    public TemplateFile loadTemplateFile(Long id) {
        final PatentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));
        final Path base = templatesRoot.toAbsolutePath().normalize();
        final Path path = base.resolve(template.getStoredPath()).normalize();
        if (!path.startsWith(base) || !Files.exists(path)) {
            throw new RuntimeException("Template file missing");
        }
        try {
            final Resource resource = new UrlResource(path.toUri());
            final String contentType = template.getContentType() != null
                    ? template.getContentType() : "application/octet-stream";
            return new TemplateFile(resource, template.getFileName(), contentType);
        } catch (MalformedURLException e) {
            throw new RuntimeException("Template file unreadable", e);
        }
    }

    public record TemplateFile(Resource resource, String fileName, String contentType) {
    }

    private void validateTemplateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds the maximum limit of 100MB");
        }
        final String extension = extensionOf(file.getOriginalFilename());
        for (String allowed : TEMPLATE_EXTENSIONS) {
            if (allowed.equals(extension)) {
                return;
            }
        }
        throw new RuntimeException("Template must be a .doc/.docx file");
    }

    private String extensionOf(String filename) {
        if (filename == null) {
            return "";
        }
        final int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot).toLowerCase(Locale.ROOT) : "";
    }

    private PatentTemplateDTO toDTO(PatentTemplate template) {
        String uploaderName = null;
        if (template.getUploadedBy() != null) {
            uploaderName = userRepository.findById(template.getUploadedBy())
                    .map(user -> user.getName() != null ? user.getName() : user.getEmail())
                    .orElse(null);
        }
        return PatentTemplateDTO.builder()
                .id(template.getId())
                .fileName(template.getFileName())
                .fileSize(template.getFileSize())
                .contentType(template.getContentType())
                .uploadedByName(uploaderName)
                .uploadedAt(template.getUploadedAt())
                .build();
    }

    // ---------------------------------------------------------------- guide doc

    /** Singleton settings row; created by the V24 migration. */
    @Transactional(readOnly = true)
    public PatentSetting getSetting() {
        return settingRepository.findById(PATENT_SETTING_ID)
                .orElseThrow(() -> new RuntimeException("Patent settings row missing (expected id="
                        + PATENT_SETTING_ID + "); check Flyway V24"));
    }

    /** The linked guide page info, or null when unset; unreadable ids are treated as unset. */
    @Transactional(readOnly = true)
    public GuideInfo getGuide() {
        final Long pageId = getSetting().getGuidePageId();
        if (pageId == null) {
            return null;
        }
        return wikiPageRepository.findById(pageId)
                .map(page -> new GuideInfo(page.getId(), page.getTitle()))
                .orElseGet(() -> {
                    log.warn("Linked guide page id={} no longer exists; treating as unset", pageId);
                    return null;
                });
    }

    public record GuideInfo(Long wikiPageId, String title) {
    }

    /** Links an existing PUBLIC wiki page as the guide doc. */
    @Transactional
    public GuideInfo linkGuide(Long wikiPageId) {
        if (wikiPageId == null) {
            throw new RuntimeException("wikiPageId is required");
        }
        final WikiPage page = wikiPageRepository.findById(wikiPageId)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + wikiPageId));
        if (page.getVisibility() != WikiVisibility.PUBLIC) {
            // Deliberate 400: linking is rejected, never auto-published.
            throw new RuntimeException("Only a PUBLIC page can be linked as the patent writing guide; "
                    + "set the page visibility to PUBLIC first");
        }
        final PatentSetting setting = getSetting();
        setting.setGuidePageId(wikiPageId);
        settingRepository.save(setting);
        log.info("Patent guide doc linked to wiki page id={}", wikiPageId);
        return new GuideInfo(page.getId(), page.getTitle());
    }

    /** Creates a dedicated PUBLIC published page and links it as the guide doc. */
    @Transactional
    public GuideInfo createGuide(String requestedTitle, User actor) {
        final String title = requestedTitle != null && !requestedTitle.isBlank()
                ? requestedTitle.trim() : DEFAULT_GUIDE_TITLE;
        final CreateWikiPageRequest request = CreateWikiPageRequest.builder()
                .title(title)
                .visibility("PUBLIC")
                .isPublished(true)
                .build();
        final WikiPageDTO created = wikiPageService.createWikiPage(request, actor);
        final PatentSetting setting = getSetting();
        setting.setGuidePageId(created.getId());
        settingRepository.save(setting);
        log.info("Patent guide doc created: wiki page id={} by user id={}",
                created.getId(), actor.getId());
        return new GuideInfo(created.getId(), created.getTitle());
    }

    /** Unlinks the guide doc; the wiki page itself survives as a normal page. */
    @Transactional
    public void unlinkGuide() {
        final PatentSetting setting = getSetting();
        if (setting.getGuidePageId() != null) {
            log.info("Patent guide doc unlinked (was wiki page id={})", setting.getGuidePageId());
        }
        setting.setGuidePageId(null);
        settingRepository.save(setting);
    }

    /** Id of the currently linked guide page, or null. Used by WikiPageService special cases. */
    @Transactional(readOnly = true)
    public Long linkedGuidePageId() {
        final PatentSetting setting = settingRepository.findById(PATENT_SETTING_ID).orElse(null);
        return setting != null ? setting.getGuidePageId() : null;
    }
}
