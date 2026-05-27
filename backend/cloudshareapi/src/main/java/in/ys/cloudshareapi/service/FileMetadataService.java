package in.yashsarvaiya.cloudshareapi.service;

import in.yashsarvaiya.cloudshareapi.document.FileMetadataDocument;
import in.yashsarvaiya.cloudshareapi.document.ProfileDocument;
import in.yashsarvaiya.cloudshareapi.dto.FileMetadataDTO;
import in.yashsarvaiya.cloudshareapi.model.CloudinaryUploadResponse;
import in.yashsarvaiya.cloudshareapi.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.nio.file.Paths;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.util.UUID;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class FileMetadataService {

    private final ProfileService profileService;
    private final UserCreditsService userCreditsService;
    private final FileMetadataRepository fileMetadataRepository;
        private final CloudinaryService cloudinaryService;

    // ---------------- UPLOAD FILES ----------------
        public List<FileMetadataDTO> uploadFiles(MultipartFile[] files) {
                return uploadFiles(files, Collections.emptyList());
        }

        public List<FileMetadataDTO> uploadFiles(MultipartFile[] files, List<String> relativePaths) {


        ProfileDocument currentProfile = profileService.getCurrentProfile();

        if (!userCreditsService.hasEnoughCredits(files.length)) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Not enough credits to upload files"
            );
        }

        List<CloudinaryUploadResponse> cloudinaryResponses = cloudinaryService.uploadFiles(files, relativePaths);

        return java.util.stream.IntStream.range(0, files.length)
                .mapToObj(index -> {
                    CloudinaryUploadResponse uploadResponse = cloudinaryResponses.get(index);
                        String relativePath = relativePaths != null && index < relativePaths.size() ? relativePaths.get(index) : null;
                        String folderPath = normalizeFolderPath(relativePath);

                                        FileMetadataDocument document = FileMetadataDocument.builder()
                            .publicId(uploadResponse.getPublicId())
                            .fileLocation(uploadResponse.getSecureUrl())
                            .name(uploadResponse.getOriginalFilename())
                            .size(uploadResponse.getBytes())
                            .type(uploadResponse.getContentType())
                            .clerkId(currentProfile.getClerkId())
                            .isPublic(false)
                            .uploadedAt(LocalDateTime.now())
                            .folderPath(folderPath)
                                                        // versioning removed
                            .build();

                    FileMetadataDocument saved = fileMetadataRepository.save(document);
                    userCreditsService.consumeCredit();

                    return mapToDTO(saved);
                })
                .collect(Collectors.toList());
    }

        private String normalizeFolderPath(String relativePath) {
                if (relativePath == null || relativePath.isBlank()) {
                        return "";
                }

                String normalized = relativePath.replace("\\", "/").trim();
                int lastSlash = normalized.lastIndexOf('/');
                if (lastSlash < 0) {
                        return "";
                }

                return normalized.substring(0, lastSlash);
        }

    // ---------------- GET USER FILES ----------------
    public List<FileMetadataDTO> getFiles() {

        ProfileDocument currentProfile = profileService.getCurrentProfile();
        return fileMetadataRepository.findByClerkId(currentProfile.getClerkId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ---------------- GET PUBLIC FILE ----------------
    public FileMetadataDTO getPublicFile(String id) {

        FileMetadataDocument file = fileMetadataRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "File not found")
                );

        if (!Boolean.TRUE.equals(file.getIsPublic())) {
            throw new ResponseStatusException(
                    FORBIDDEN,
                    "File is not public"
            );
        }

        return mapToDTO(file);
    }

    // ---------------- DOWNLOAD FILE ----------------
    public FileMetadataDTO getViewableFile(String id) {

        FileMetadataDocument file = fileMetadataRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "File not found")
                );

        validateFileAccess(file);
        return mapToDTO(file);
    }

    // ---------------- DOWNLOAD FILE ----------------
    public FileMetadataDTO getDownloadableFile(String id) {

        FileMetadataDocument file = fileMetadataRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "File not found")
                );

        validateFileAccess(file);

        return mapToDTO(file);
    }

        public FileMetadataDTO getDownloadableFileByPublicId(String publicId) {
                System.out.println("getDownloadableFileByPublicId: resolving -> '" + publicId + "'");

                String decodedPublicId = publicId;
                try {
                        decodedPublicId = java.net.URLDecoder.decode(publicId, java.nio.charset.StandardCharsets.UTF_8);
                        System.out.println("Decoded publicId: " + decodedPublicId);
                } catch (Exception e) {
                        System.out.println("Error during publicId decode: " + e.getMessage());
                }

                FileMetadataDocument file = null;

                try {
                        file = fileMetadataRepository.findByPublicId(decodedPublicId);
                        if (file != null) {
                                System.out.println("Lookup by publicId exact succeeded: publicId=" + file.getPublicId());
                        }
                } catch (Exception e) {
                        System.out.println("Error during findByPublicId: " + e.getMessage());
                }

                if (file == null) {
                        try {
                                var candidates = fileMetadataRepository.findByPublicIdContaining(decodedPublicId);
                                if (candidates != null && !candidates.isEmpty()) {
                                        file = candidates.get(0);
                                        System.out.println("Lookup by publicId containing succeeded: publicId=" + file.getPublicId());
                                }
                        } catch (Exception e) {
                                System.out.println("Error during findByPublicIdContaining: " + e.getMessage());
                        }
                }

                if (file == null) {
                        try {
                                String candidate = decodedPublicId;
                                int lastSlash = candidate.lastIndexOf('/');
                                if (lastSlash >= 0) candidate = candidate.substring(lastSlash + 1);
                                int lastDot = candidate.lastIndexOf('.');
                                if (lastDot > 0) candidate = candidate.substring(0, lastDot);
                                if (!candidate.equals(decodedPublicId)) {
                                        file = fileMetadataRepository.findByPublicId(candidate);
                                        if (file != null) {
                                                System.out.println("Lookup by stripped publicId succeeded: candidate=" + candidate + " -> publicId=" + file.getPublicId());
                                        }
                                }
                        } catch (Exception e) {
                                System.out.println("Error during stripped publicId lookup: " + e.getMessage());
                        }
                }

                if (file == null) {
                        System.out.println("Final publicId resolution failed for: '" + decodedPublicId + "' - returning NOT_FOUND");
                        throw new ResponseStatusException(NOT_FOUND, "File not found");
                }

                validateFileAccess(file);
                return mapToDTO(file);
        }

        // Compatibility fallback for legacy callers; preview should use publicId.
        public FileMetadataDTO getDownloadableFileByAnyId(String idOrPublicId) {
                System.out.println("getDownloadableFileByAnyId: resolving -> '" + idOrPublicId + "'");
                if (idOrPublicId == null || idOrPublicId.isBlank()) {
                        throw new ResponseStatusException(NOT_FOUND, "File not found");
                }

                try {
                        return getDownloadableFileByPublicId(idOrPublicId);
                } catch (ResponseStatusException ex) {
                        // continue to legacy id lookup below
                        System.out.println("PublicId resolution failed, trying legacy lookup: " + ex.getReason());
                }

                // try by _id
                FileMetadataDocument file = null;
                try {
                        var maybe = fileMetadataRepository.findById(idOrPublicId);
                        if (maybe.isPresent()) {
                                file = maybe.get();
                                System.out.println("Lookup by _id succeeded: id=" + file.getId());
                        }
                } catch (Exception e) {
                        System.out.println("Error during findById: " + e.getMessage());
                }

                // try publicId exact match
                if (file == null) {
                        try {
                                file = fileMetadataRepository.findByPublicId(idOrPublicId);
                                if (file != null) System.out.println("Lookup by publicId exact succeeded: publicId=" + file.getPublicId());
                        } catch (Exception e) {
                                System.out.println("Error during findByPublicId: " + e.getMessage());
                        }
                }

                // try publicId containing
                if (file == null) {
                        try {
                                var candidates = fileMetadataRepository.findByPublicIdContaining(idOrPublicId);
                                if (candidates != null && !candidates.isEmpty()) {
                                        file = candidates.get(0);
                                        System.out.println("Lookup by publicId containing succeeded: publicId=" + file.getPublicId());
                                }
                        } catch (Exception e) {
                                System.out.println("Error during findByPublicIdContaining: " + e.getMessage());
                        }
                }

                // try URL-decoded publicId
                if (file == null) {
                        try {
                                String decoded = java.net.URLDecoder.decode(idOrPublicId, java.nio.charset.StandardCharsets.UTF_8);
                                file = fileMetadataRepository.findByPublicId(decoded);
                                if (file != null) System.out.println("Lookup by decoded publicId succeeded: decoded=" + decoded + " -> publicId=" + file.getPublicId());
                        } catch (Exception e) {
                                System.out.println("Error during URL decode lookup: " + e.getMessage());
                        }
                }

                // try stripping path segments and extension (e.g., full URL or folder/publicId.ext)
                if (file == null) {
                        try {
                                String candidate = idOrPublicId;
                                int lastSlash = candidate.lastIndexOf('/');
                                if (lastSlash >= 0) candidate = candidate.substring(lastSlash + 1);
                                int lastDot = candidate.lastIndexOf('.');
                                if (lastDot > 0) candidate = candidate.substring(0, lastDot);
                                if (!candidate.equals(idOrPublicId)) {
                                        file = fileMetadataRepository.findByPublicId(candidate);
                                        if (file != null) System.out.println("Lookup by stripped candidate succeeded: candidate=" + candidate + " -> publicId=" + file.getPublicId());
                                }
                        } catch (Exception e) {
                                System.out.println("Error during path/extension strip lookup: " + e.getMessage());
                        }
                }

                // try filename fallback
                if (file == null) {
                        try {
                                var nameCandidates = fileMetadataRepository.findByNameContaining(idOrPublicId);
                                if (nameCandidates != null && !nameCandidates.isEmpty()) {
                                        file = nameCandidates.get(0);
                                        System.out.println("Lookup by name containing succeeded: name=" + file.getName() + " -> publicId=" + file.getPublicId());
                                }
                        } catch (Exception e) {
                                System.out.println("Error during findByNameContaining: " + e.getMessage());
                        }
                }

                if (file == null) {
                        System.out.println("Final resolution failed for: '" + idOrPublicId + "' - returning NOT_FOUND");
                        throw new ResponseStatusException(NOT_FOUND, "File not found");
                }

                validateFileAccess(file);

                return mapToDTO(file);
        }

    private void validateFileAccess(FileMetadataDocument file) {
        if (Boolean.TRUE.equals(file.getIsPublic())) {
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAuthenticated = authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName());

        if (!isAuthenticated) {
            throw new ResponseStatusException(FORBIDDEN, "Private file cannot be accessed");
        }

        ProfileDocument currentProfile = profileService.getCurrentProfile();
                if (!Objects.equals(file.getClerkId(), currentProfile.getClerkId())) {
            throw new ResponseStatusException(FORBIDDEN, "File does not belong to current user");
        }
    }

    // ---------------- DELETE FILE ----------------
    public void deleteFile(String id) {

        ProfileDocument currentProfile = profileService.getCurrentProfile();

        FileMetadataDocument file = fileMetadataRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "File not found")
                );

        if (!Objects.equals(file.getClerkId(), currentProfile.getClerkId())) {
            throw new ResponseStatusException(
                    FORBIDDEN,
                    "File does not belong to current user"
            );
        }

                try {
                        cloudinaryService.deleteFile(file.getPublicId());
                        fileMetadataRepository.deleteById(id);
                } catch (Exception e) {
                        throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Error deleting file");
        }
    }

    // ---------------- TOGGLE PUBLIC ----------------
    public FileMetadataDTO togglePublic(String id) {

        ProfileDocument currentProfile = profileService.getCurrentProfile();

        FileMetadataDocument file = fileMetadataRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "File not found")
                );

        if (!Objects.equals(file.getClerkId(), currentProfile.getClerkId())) {
            throw new ResponseStatusException(
                    FORBIDDEN,
                    "File does not belong to current user"
            );
        }

        file.setIsPublic(!file.getIsPublic());
        return mapToDTO(fileMetadataRepository.save(file));
    }

    // ---------------- MAPPER ----------------
        public FileMetadataDTO mapToDTO(FileMetadataDocument file) {
                String rawLocation = file.getFileLocation();
                String resolvedLocation = rawLocation;

                if (rawLocation != null && !(rawLocation.startsWith("http://") || rawLocation.startsWith("https://"))) {
                        try {
                                String filename = Paths.get(rawLocation).getFileName().toString();
                                resolvedLocation = ServletUriComponentsBuilder.fromCurrentContextPath()
                                                .path("/uploads/")
                                                .path(filename)
                                                .toUriString();
                        } catch (Exception ex) {
                                // fallback to rawLocation if anything fails
                                resolvedLocation = rawLocation;
                        }
                }

                return FileMetadataDTO.builder()
                                .id(file.getId())
                                .publicId(file.getPublicId())
                                .fileLocation(resolvedLocation)
                                .name(file.getName())
                                .size(file.getSize())
                                .type(file.getType())
                                .clerkId(file.getClerkId())
                                .isPublic(file.getIsPublic())
                                .uploadedAt(file.getUploadedAt())
                                .folderPath(file.getFolderPath())
                                .build();
    }

    // Versioning removed: getFileVersions and restoreVersion are no longer supported
}
