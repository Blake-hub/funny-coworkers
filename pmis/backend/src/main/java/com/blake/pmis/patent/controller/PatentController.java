package com.blake.pmis.patent.controller;

import com.blake.pmis.entity.User;
import com.blake.pmis.entity.enumeration.PatentCategory;
import com.blake.pmis.entity.enumeration.PatentStatus;
import com.blake.pmis.entity.enumeration.PatentType;
import com.blake.pmis.patent.dto.PatentDetailDTO;
import com.blake.pmis.patent.dto.PatentListDTO;
import com.blake.pmis.patent.service.PatentAdminService;
import com.blake.pmis.patent.service.PatentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patents")
@RequiredArgsConstructor
@Tag(name = "Patents", description = "Patent application management APIs")
public class PatentController {

    private final PatentService patentService;
    private final PatentAdminService patentAdminService;
    private final ObjectMapper objectMapper;

    private User getCurrentUser() {
        final Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof User user ? user : null;
    }

    @GetMapping
    @Operation(summary = "List patents (no pagination; search title/inventors/application number)")
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "all") String scope) {
        final User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        final List<PatentListDTO> items = patentService.list(user, q, scope);
        final boolean viewerIsPatentAdmin = patentAdminService.isPatentAdmin(user);
        return ResponseEntity.ok(Map.of(
                "items", items,
                "total", items.size(),
                "viewerIsPatentAdmin", viewerIsPatentAdmin));
    }

    @PostMapping
    @Operation(summary = "Create a patent application with a disclosure file")
    public ResponseEntity<?> create(
            @RequestParam("title") String title,
            @RequestParam("inventors") String inventorsJson,
            @RequestParam(value = "patentCategory", required = false) PatentCategory patentCategory,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        final User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        final List<String> inventors = parseInventors(inventorsJson);
        final PatentDetailDTO detail = patentService.create(user, title, inventors, file, patentCategory);
        return ResponseEntity.status(HttpStatus.CREATED).body(detail);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Patent detail with viewer-specific flags and allowed transitions")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        final User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(patentService.getDetail(user, id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Creator edit before RECEIVED; admin edit title (any status) + category before ACCEPTED")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestParam("title") String title,
                                    @RequestParam("inventors") String inventorsJson,
                                    @RequestParam(value = "patentCategory", required = false) PatentCategory patentCategory,
                                    @RequestParam(value = "file", required = false) MultipartFile file) {
        final User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        final List<String> inventors = parseInventors(inventorsJson);
        return ResponseEntity.ok(patentService.update(user, id, title, inventors, file, patentCategory));
    }

    @PostMapping("/{id}/transition")
    @Operation(summary = "Status transition (patent admins; creators may withdraw while SUBMITTED)")
    public ResponseEntity<?> transition(@PathVariable Long id,
                                        @RequestParam("toStatus") PatentStatus toStatus,
                                        @RequestParam(value = "eventDate", required = false) LocalDate eventDate,
                                        @RequestParam(value = "applicationNumber", required = false) String applicationNumber,
                                        @RequestParam(value = "certificateNumber", required = false) String certificateNumber,
                                        @RequestParam(value = "applicationType", required = false) PatentType applicationType,
                                        @RequestParam(value = "file", required = false) MultipartFile file) {
        final User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(patentService.transition(user, id, toStatus, eventDate,
                applicationNumber, certificateNumber, applicationType, file));
    }

    @PostMapping("/{id}/transition/undo")
    @Operation(summary = "Undo the latest live transition (patent admins only)")
    public ResponseEntity<?> undo(@PathVariable Long id) {
        final User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(patentService.undo(user, id));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Add a manual comment")
    public ResponseEntity<?> addComment(@PathVariable Long id,
                                        @RequestBody Map<String, String> body) {
        final User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(patentService.addComment(user, id,
                body != null ? body.get("content") : null));
    }

    @GetMapping("/{id}/attachments/{attachmentId}/download")
    @Operation(summary = "Download an attachment; DISCLOSURE restricted to creator + patent admins")
    public ResponseEntity<Resource> download(@PathVariable Long id, @PathVariable Long attachmentId) {
        final User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        final PatentService.AttachmentFile file = patentService.loadAttachmentFile(user, id, attachmentId);
        try {
            final Resource resource = new UrlResource(file.path().toUri());
            final String encodedName = URLEncoder.encode(file.fileName(), StandardCharsets.UTF_8)
                    .replace("+", "%20");
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(file.contentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename*=UTF-8''" + encodedName)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private List<String> parseInventors(String inventorsJson) {
        try {
            return objectMapper.readValue(
                    inventorsJson == null ? "[]" : inventorsJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            throw new RuntimeException("Invalid inventors payload");
        }
    }
}
