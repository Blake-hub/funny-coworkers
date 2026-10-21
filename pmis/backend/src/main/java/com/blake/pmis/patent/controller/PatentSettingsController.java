package com.blake.pmis.patent.controller;

import com.blake.pmis.entity.User;
import com.blake.pmis.patent.dto.PatentTemplateDTO;
import com.blake.pmis.patent.service.PatentAdminService;
import com.blake.pmis.patent.service.PatentSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Patent module settings: disclosure templates and the linked
 * "patent writing guide" wiki page. Admin endpoints require the
 * patent admin privilege (module-level, not global ADMIN).
 */
@RestController
@RequestMapping("/api/patents")
@RequiredArgsConstructor
@Tag(name = "Patent Settings", description = "Disclosure templates and guide document settings")
public class PatentSettingsController {

    private final PatentSettingsService settingsService;
    private final PatentAdminService patentAdminService;

    private User getCurrentUser() {
        final Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof User user ? user : null;
    }

    private User requirePatentAdmin() {
        final User user = getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("Authentication required");
        }
        if (!patentAdminService.isPatentAdmin(user)) {
            throw new AccessDeniedException("Only patent admins can manage patent settings");
        }
        return user;
    }

    private User requireUser() {
        final User user = getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("Authentication required");
        }
        return user;
    }

    // ---------------------------------------------------------------- templates

    @GetMapping("/templates")
    @Operation(summary = "List disclosure templates (any logged-in user)")
    public ResponseEntity<List<PatentTemplateDTO>> listTemplates() {
        requireUser();
        return ResponseEntity.ok(settingsService.listTemplates());
    }

    @GetMapping("/templates/{id}/download")
    @Operation(summary = "Download a disclosure template (any logged-in user)")
    public ResponseEntity<Resource> downloadTemplate(@PathVariable Long id) {
        requireUser();
        final PatentSettingsService.TemplateFile file = settingsService.loadTemplateFile(id);
        final String encodedName = URLEncoder.encode(file.fileName(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encodedName)
                .body(file.resource());
    }

    @GetMapping("/admin/templates")
    @Operation(summary = "List disclosure templates (patent admin view)")
    public ResponseEntity<List<PatentTemplateDTO>> listTemplatesAdmin() {
        requirePatentAdmin();
        return ResponseEntity.ok(settingsService.listTemplates());
    }

    @PostMapping("/admin/templates")
    @Operation(summary = "Upload a disclosure template (.doc/.docx, max 100MB)")
    public ResponseEntity<?> uploadTemplate(@RequestParam("file") MultipartFile file) {
        final User admin = requirePatentAdmin();
        return ResponseEntity.status(HttpStatus.CREATED).body(settingsService.uploadTemplate(file, admin));
    }

    @DeleteMapping("/admin/templates/{id}")
    @Operation(summary = "Delete a disclosure template (file removed from disk too)")
    public ResponseEntity<Map<String, Object>> deleteTemplate(@PathVariable Long id) {
        requirePatentAdmin();
        settingsService.deleteTemplate(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    // ---------------------------------------------------------------- guide doc

    @GetMapping("/guide")
    @Operation(summary = "Get the linked patent writing guide page (null when unset)")
    public ResponseEntity<PatentSettingsService.GuideInfo> getGuide() {
        requireUser();
        return ResponseEntity.ok(settingsService.getGuide());
    }

    @PostMapping("/admin/guide")
    @Operation(summary = "Link an existing PUBLIC wiki page as the guide doc")
    public ResponseEntity<?> linkGuide(@RequestBody Map<String, Long> body) {
        requirePatentAdmin();
        final Long wikiPageId = body != null ? body.get("wikiPageId") : null;
        return ResponseEntity.ok(settingsService.linkGuide(wikiPageId));
    }

    @PostMapping("/admin/guide/create")
    @Operation(summary = "Create a dedicated PUBLIC guide page and link it")
    public ResponseEntity<?> createGuide(@RequestBody Map<String, String> body) {
        final User admin = requirePatentAdmin();
        final String title = body != null ? body.get("title") : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(settingsService.createGuide(title, admin));
    }

    @DeleteMapping("/admin/guide")
    @Operation(summary = "Unlink the guide doc (the wiki page survives)")
    public ResponseEntity<Map<String, Object>> unlinkGuide() {
        requirePatentAdmin();
        settingsService.unlinkGuide();
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
