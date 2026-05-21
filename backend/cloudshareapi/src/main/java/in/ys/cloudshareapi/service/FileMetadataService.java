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
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

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


        ProfileDocument currentProfile = profileService.getCurrentProfile();

        if (!userCreditsService.hasEnoughCredits(files.length)) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Not enough credits to upload files"
            );
        }

        List<CloudinaryUploadResponse> cloudinaryResponses = cloudinaryService.uploadFiles(files);

        return java.util.stream.IntStream.range(0, files.length)
                .mapToObj(index -> {
                    CloudinaryUploadResponse uploadResponse = cloudinaryResponses.get(index);

                    FileMetadataDocument document = FileMetadataDocument.builder()
                            .publicId(uploadResponse.getPublicId())
                            .fileLocation(uploadResponse.getSecureUrl())
                            .name(uploadResponse.getOriginalFilename())
                            .size(uploadResponse.getBytes())
                            .type(uploadResponse.getContentType())
                            .clerkId(currentProfile.getClerkId())
                            .isPublic(false)
                            .uploadedAt(LocalDateTime.now())
                            .build();

                    FileMetadataDocument saved = fileMetadataRepository.save(document);
                    userCreditsService.consumeCredit();

                    return mapToDTO(saved);
                })
                .collect(Collectors.toList());
    }

    // ---------------- GET USER FILES ----------------
    public List<FileMetadataDTO> getFiles() {

        ProfileDocument currentProfile = profileService.getCurrentProfile();
        return fileMetadataRepository
                .findByClerkId(currentProfile.getClerkId())
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
    private FileMetadataDTO mapToDTO(FileMetadataDocument file) {
        return FileMetadataDTO.builder()
                .id(file.getId())
                .publicId(file.getPublicId())
                .fileLocation(file.getFileLocation())
                .name(file.getName())
                .size(file.getSize())
                .type(file.getType())
                .clerkId(file.getClerkId())
                .isPublic(file.getIsPublic())
                .uploadedAt(file.getUploadedAt())
                .build();
    }
}
