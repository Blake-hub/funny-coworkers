package com.blake.pmis.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;

@RestController
@RequestMapping("/api/files")
public class LocalImageController {

    // Only allow image file extensions to prevent arbitrary file reads.
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff", ".tif"
    );

    @GetMapping("/local-image")
    public ResponseEntity<byte[]> getLocalImage(@RequestParam String path) {
        if (path == null || path.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Normalize: handle both Windows backslashes and forward slashes.
        String normalized = path.replace('/', '\\').replace("file:\\", "").replace("file:", "");
        // Strip leading backslashes (e.g. "\C:\Users..." -> "C:\Users...")
        while (normalized.startsWith("\\")) {
            normalized = normalized.substring(1);
        }

        String lower = normalized.toLowerCase();
        boolean validExtension = ALLOWED_EXTENSIONS.stream().anyMatch(lower::endsWith);
        if (!validExtension) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Path filePath = Paths.get(normalized);
            if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] imageBytes = Files.readAllBytes(filePath);
            String contentType = getContentType(lower);

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Cache-Control", "no-cache")
                    .header("Access-Control-Allow-Origin", "*")
                    .body(imageBytes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String getContentType(String lowerPath) {
        if (lowerPath.endsWith(".png")) return "image/png";
        if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) return "image/jpeg";
        if (lowerPath.endsWith(".gif")) return "image/gif";
        if (lowerPath.endsWith(".bmp")) return "image/bmp";
        if (lowerPath.endsWith(".webp")) return "image/webp";
        if (lowerPath.endsWith(".tif") || lowerPath.endsWith(".tiff")) return "image/tiff";
        return "application/octet-stream";
    }
}
