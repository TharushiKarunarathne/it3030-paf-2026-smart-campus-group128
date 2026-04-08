package com.smartcampus.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/uploads")
public class FileController {

    @GetMapping("/{type}/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String type,
            @PathVariable String filename) throws IOException {

        // Validate type to prevent path traversal
        if (!type.matches("^(profiles|tickets)$")) {
            return ResponseEntity.badRequest().build();
        }

        // Validate filename to prevent path traversal
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }

        String baseDir = System.getProperty("user.dir");
        Path filePath = Paths.get(baseDir, "uploads", type, filename);

        System.out.println("==> File request: " + filePath);
        System.out.println("    Exists: " + Files.exists(filePath));

        if (!Files.exists(filePath)) {
            System.out.println("    ERROR: File not found");
            return ResponseEntity.notFound().build();
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.isReadable()) {
                System.out.println("    ERROR: File not readable");
                return ResponseEntity.status(500).build();
            }

            // Determine media type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            System.out.println("    Content-Type: " + contentType);
            System.out.println("    Serving file successfully");

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            System.out.println("    ERROR: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}
