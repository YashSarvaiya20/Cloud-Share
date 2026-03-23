package in.yashsarvaiya.cloudshareapi.service;

import in.yashsarvaiya.cloudshareapi.document.FileMetadataDocument;
import in.yashsarvaiya.cloudshareapi.document.ProfileDocument;
import in.yashsarvaiya.cloudshareapi.dto.FileMetadataDTO;
import in.yashsarvaiya.cloudshareapi.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class FileMetadataService {

    private final ProfileService profileService;
    private final UserCreditsService userCreditsService;
    private final FileMetadataRepository fileMetadataRepository;

    // ---------------- UPLOAD FILES ----------------



    public List<FileMetadataDTO> uploadFiles(MultipartFile[] files) throws IOException {


        ProfileDocument currentProfile = profileService.getCurrentProfile();

        if (!userCreditsService.hasEnoughCredits(files.length)) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Not enough credits to upload files"
            );
        }

        Path uploadPath = Paths.get("upload")
                .toAbsolutePath()
                .normalize();

        Files.createDirectories(uploadPath);

        return List.of(files).stream().map(file -> {
            try {
                String fileName = UUID.randomUUID() + "." +
                        StringUtils.getFilenameExtension(file.getOriginalFilename());

                Path targetLocation = uploadPath.resolve(fileName);
                Files.copy(
                        file.getInputStream(),
                        targetLocation,
                        StandardCopyOption.REPLACE_EXISTING
                );

                FileMetadataDocument document = FileMetadataDocument.builder()
                        .fileLocation(targetLocation.toString())
                        .name(file.getOriginalFilename())
                        .size(file.getSize())
                        .type(file.getContentType())
                        .clerkId(currentProfile.getClerkId())
                        .isPublic(false)
                        .uploadedAt(LocalDateTime.now())
                        .build();

                // consume credit AFTER successful save
                FileMetadataDocument saved = fileMetadataRepository.save(document);
                userCreditsService.consumeCredit();

                return mapToDTO(saved);

            } catch (IOException e) {
                throw new ResponseStatusException(
                        INTERNAL_SERVER_ERROR,
                        "Failed to upload file"
                );
            }
        }).collect(Collectors.toList());
    }

    // ---------------- GET USER FILES ----------------
    public List<FileMetadataDTO> getFiles() {

        ProfileDocument currentProfile = profileService.getCurrentProfile();
        System.out.println("➡ Reached service layer");
        System.out.println("➡ ClerkId = " + currentProfile.getClerkId());

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
    public FileMetadataDTO getDownloadableFile(String id) {

        FileMetadataDocument file = fileMetadataRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "File not found")
                );

        return mapToDTO(file);
    }

    // ---------------- DELETE FILE ----------------
    public void deleteFile(String id) {

        ProfileDocument currentProfile = profileService.getCurrentProfile();

        FileMetadataDocument file = fileMetadataRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "File not found")
                );

        if (!file.getClerkId().equals(currentProfile.getClerkId())) {
            throw new ResponseStatusException(
                    FORBIDDEN,
                    "File does not belong to current user"
            );
        }

        try {
            Files.deleteIfExists(Paths.get(file.getFileLocation()));
            fileMetadataRepository.deleteById(id);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    INTERNAL_SERVER_ERROR,
                    "Error deleting file"
            );
        }
    }

    // ---------------- TOGGLE PUBLIC ----------------
    public FileMetadataDTO togglePublic(String id) {

        ProfileDocument currentProfile = profileService.getCurrentProfile();

        FileMetadataDocument file = fileMetadataRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(NOT_FOUND, "File not found")
                );

        if (!file.getClerkId().equals(currentProfile.getClerkId())) {
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
