package in.yashsarvaiya.cloudshareapi.service;

import com.cloudinary.Cloudinary;
import in.yashsarvaiya.cloudshareapi.exceptions.CloudinaryUploadException;
import in.yashsarvaiya.cloudshareapi.exceptions.InvalidFileException;
import in.yashsarvaiya.cloudshareapi.model.CloudinaryUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public List<CloudinaryUploadResponse> uploadFiles(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new InvalidFileException("At least one file is required");
        }

        List<CloudinaryUploadResponse> responses = new ArrayList<>();
        for (MultipartFile file : files) {
            responses.add(uploadSingleFile(file));
        }
        return responses;
    }

    private CloudinaryUploadResponse uploadSingleFile(MultipartFile file) {
        validateFile(file);

        try {
            Map<String, Object> options = new HashMap<>();
            options.put("resource_type", "auto");
            options.put("folder", "cloudshare");
            options.put("use_filename", true);
            options.put("unique_filename", false);
            options.put("public_id", UUID.randomUUID().toString());

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

            return CloudinaryUploadResponse.builder()
                    .publicId(String.valueOf(uploadResult.get("public_id")))
                    .secureUrl(String.valueOf(uploadResult.get("secure_url")))
                    .resourceType(String.valueOf(uploadResult.get("resource_type")))
                    .originalFilename(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .bytes(((Number) uploadResult.get("bytes")).longValue())
                    .build();
        } catch (IOException ex) {
            throw new CloudinaryUploadException("Failed to upload file to Cloudinary", ex);
        }
    }

    public void deleteFile(String publicId) {
        if (!StringUtils.hasText(publicId)) {
            return;
        }

        List<String> resourceTypes = List.of("image", "raw", "video");
        IOException lastException = null;

        for (String resourceType : resourceTypes) {
            try {
                Map<?, ?> result = cloudinary.uploader().destroy(
                        publicId,
                        Map.of("resource_type", resourceType, "invalidate", true)
                );

                if ("ok".equals(String.valueOf(result.get("result")))) {
                    return;
                }
            } catch (IOException ex) {
                lastException = ex;
            }
        }

        if (lastException != null) {
            throw new CloudinaryUploadException("Failed to delete file from Cloudinary", lastException);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("File is required and cannot be empty");
        }

        if (!StringUtils.hasText(file.getOriginalFilename())) {
            throw new InvalidFileException("File name is missing");
        }

        if (!StringUtils.hasText(file.getContentType())) {
            throw new InvalidFileException("File content type is missing");
        }
    }
}