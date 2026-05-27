package in.yashsarvaiya.cloudshareapi.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import in.yashsarvaiya.cloudshareapi.dto.FileMetadataDTO;
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
        return uploadFiles(files, List.of());
    }

    public List<CloudinaryUploadResponse> uploadFiles(MultipartFile[] files, List<String> relativePaths) {
        if (files == null || files.length == 0) {
            throw new InvalidFileException("At least one file is required");
        }

        List<CloudinaryUploadResponse> responses = new ArrayList<>();
        for (int index = 0; index < files.length; index++) {
            MultipartFile file = files[index];
            String relativePath = relativePaths != null && index < relativePaths.size() ? relativePaths.get(index) : null;
            responses.add(uploadSingleFile(file, relativePath));
        }
        return responses;
    }

    private CloudinaryUploadResponse uploadSingleFile(MultipartFile file, String relativePath) {
        validateFile(file);

        try {
            Map<String, Object> options = new HashMap<>();
            options.put("resource_type", "auto");
            options.put("use_filename", true);
            options.put("unique_filename", false);
            options.put("public_id", UUID.randomUUID().toString());

            String folderPrefix = resolveFolderPrefix(relativePath);
            options.put("folder", StringUtils.hasText(folderPrefix) ? folderPrefix : "cloudshare");

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

    public List<String> buildPreviewUrlCandidates(FileMetadataDTO file) {
        if (file == null || !StringUtils.hasText(file.getPublicId())) {
            return List.of();
        }

        String publicId = file.getPublicId();
        String resourceType = guessResourceType(file.getType(), file.getName());

        List<String> candidates = new ArrayList<>();
        if (isPdf(file)) {
            try {
                candidates.add(cloudinary.privateDownload(publicId, "pdf", Map.of("resource_type", "image")));
            } catch (Exception ex) {
                System.out.println("Cloudinary privateDownload fallback failed for publicId=" + publicId + " -> " + ex.getMessage());
            }
            candidates.add(buildDeliveryUrl(publicId, resourceType, file.getName(), "authenticated", true));
        }
        candidates.add(buildDeliveryUrl(publicId, resourceType, file.getName(), true));
        candidates.add(buildDeliveryUrl(publicId, resourceType, file.getName(), false));

        for (String fallbackType : List.of("raw", "image", "video")) {
            if (!fallbackType.equals(resourceType)) {
                if (isPdf(file)) {
                    candidates.add(buildDeliveryUrl(publicId, fallbackType, file.getName(), "authenticated", true));
                }
                candidates.add(buildDeliveryUrl(publicId, fallbackType, file.getName(), true));
                candidates.add(buildDeliveryUrl(publicId, fallbackType, file.getName(), false));
            }
        }

        return candidates;
    }

    private String buildDeliveryUrl(String publicId, String resourceType, String fileName, boolean signed) {
        return buildDeliveryUrl(publicId, resourceType, fileName, "upload", signed);
    }

    private String buildDeliveryUrl(String publicId, String resourceType, String fileName, String deliveryType, boolean signed) {
        String deliveryId = publicId;
        if (StringUtils.hasText(fileName)) {
            String extension = extractExtension(fileName);
            if (StringUtils.hasText(extension) && !publicId.toLowerCase().endsWith("." + extension.toLowerCase())) {
                deliveryId = publicId + "." + extension;
            }
        }

        return cloudinary.url()
                .resourceType(resourceType)
                .type(deliveryType)
                .secure(true)
                .signed(signed)
                .generate(deliveryId);
    }

    private boolean isPdf(FileMetadataDTO file) {
        if (file == null) {
            return false;
        }

        if (StringUtils.hasText(file.getType()) && "application/pdf".equalsIgnoreCase(file.getType())) {
            return true;
        }

        return StringUtils.hasText(file.getName()) && file.getName().toLowerCase().endsWith(".pdf");
    }

    private String extractExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return null;
        }
        return fileName.substring(dotIndex + 1);
    }

    private String guessResourceType(String contentType, String fileName) {
        if (StringUtils.hasText(contentType)) {
            if (contentType.startsWith("image/")) return "image";
            if (contentType.startsWith("video/")) return "video";
            if ("application/pdf".equalsIgnoreCase(contentType)) return "image";
        }

        if (StringUtils.hasText(fileName)) {
            String lowerName = fileName.toLowerCase();
            if (lowerName.endsWith(".pdf")) {
                return "image";
            }
            if (lowerName.endsWith(".mp4") || lowerName.endsWith(".webm") || lowerName.endsWith(".mov")) {
                return "video";
            }
            if (lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".gif") || lowerName.endsWith(".webp")) {
                return "image";
            }
        }

        return "raw";
    }

    public String resolveFolderPrefix(String relativePath) {
        if (!StringUtils.hasText(relativePath)) {
            return "cloudshare";
        }

        String normalized = relativePath.replace("\\", "/").trim();
        int lastSlash = normalized.lastIndexOf('/');
        if (lastSlash < 0) {
            return "cloudshare";
        }

        String folder = normalized.substring(0, lastSlash).trim();
        if (!StringUtils.hasText(folder)) {
            return "cloudshare";
        }

        return "cloudshare/" + folder;
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