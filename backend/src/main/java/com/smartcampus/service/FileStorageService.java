package com.smartcampus.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.logging.Logger;

@Service
public class FileStorageService {

    private static final Logger logger = Logger.getLogger(FileStorageService.class.getName());
    private final Path uploadDir;

    public FileStorageService() {
        // Use absolute path in project root
        String baseDir = System.getProperty("user.dir");
        this.uploadDir = Paths.get(baseDir).toAbsolutePath();
        logger.info("FileStorageService initialized. Base upload dir: " + uploadDir);
    }

    public String saveProfilePhoto(MultipartFile file) throws IOException {
        return saveFile(file, "uploads/profiles");
    }

    public String saveTicketImage(MultipartFile file) throws IOException {
        return saveFile(file, "uploads/tickets");
    }

    private String saveFile(MultipartFile file, String subdir) throws IOException {
        Path dirPath = uploadDir.resolve(subdir);
        logger.info("Saving file to directory: " + dirPath);

        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
            logger.info("Created directory: " + dirPath);
        }

        String filename = UUID.randomUUID() + "_" + sanitizeFilename(file.getOriginalFilename());
        Path filePath = dirPath.resolve(filename);
        logger.info("Saving file: " + filePath);

        Files.copy(file.getInputStream(), filePath);
        logger.info("File saved successfully");

        // Return web-accessible URL
        String url = "/" + subdir + "/" + filename;
        logger.info("Returning URL: " + url);
        return url;
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) return "file";
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}

