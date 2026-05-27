package in.yashsarvaiya.cloudshareapi.service;

import in.yashsarvaiya.cloudshareapi.document.FileMetadataDocument;
import in.yashsarvaiya.cloudshareapi.document.ProfileDocument;
import in.yashsarvaiya.cloudshareapi.document.ShareLinkDocument;
import in.yashsarvaiya.cloudshareapi.dto.FileMetadataDTO;
import in.yashsarvaiya.cloudshareapi.dto.ShareLinkCreateRequest;
import in.yashsarvaiya.cloudshareapi.dto.ShareLinkResponseDTO;
import in.yashsarvaiya.cloudshareapi.repository.FileMetadataRepository;
import in.yashsarvaiya.cloudshareapi.repository.ShareLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShareLinkService {
    private final ProfileService profileService;
    private final FileMetadataRepository fileMetadataRepository;
    private final ShareLinkRepository shareLinkRepository;
    private final FileMetadataService fileMetadataService;

    public ShareLinkResponseDTO createShareLink(ShareLinkCreateRequest request) {
        if (request == null || request.getFileId() == null || request.getFileId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File id is required");
        }

        FileMetadataDocument file = fileMetadataRepository.findById(request.getFileId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        ProfileDocument currentProfile = profileService.getCurrentProfile();
        if (!Objects.equals(file.getClerkId(), currentProfile.getClerkId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "File does not belong to current user");
        }

        Duration ttl = parseDuration(request.getExpiryDuration());
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plus(ttl);
        String token = UUID.randomUUID().toString().replace("-", "");

        ShareLinkDocument shareLink = ShareLinkDocument.builder()
                .token(token)
                .fileId(file.getId())
                .clerkId(currentProfile.getClerkId())
                .createdAt(now)
                .expiresAt(expiresAt)
                .accessCount(0)
                .build();

        shareLinkRepository.save(shareLink);
        return buildResponse(shareLink, file);
    }

    public ShareLinkResponseDTO resolveShareLink(String token) {
        ShareLinkDocument shareLink = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Share link not found"));

        if (shareLink.getExpiresAt() != null && shareLink.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "This share link has expired");
        }

        FileMetadataDocument file = fileMetadataRepository.findById(shareLink.getFileId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared file not found"));

        shareLink.setLastAccessedAt(LocalDateTime.now());
        shareLink.setAccessCount(shareLink.getAccessCount() == null ? 1 : shareLink.getAccessCount() + 1);
        shareLinkRepository.save(shareLink);

        return buildResponse(shareLink, file);
    }

    public FileMetadataDTO getSharedFile(String token) {
        return resolveShareLink(token).getFile();
    }

    @Scheduled(cron = "0 */10 * * * *")
    public void cleanupExpiredLinks() {
        shareLinkRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }

    private ShareLinkResponseDTO buildResponse(ShareLinkDocument shareLink, FileMetadataDocument file) {
        FileMetadataDTO dto = fileMetadataService.mapToDTO(file);
        String shareUrl = "/share/" + shareLink.getToken();
        return ShareLinkResponseDTO.builder()
                .token(shareLink.getToken())
                .shareUrl(shareUrl)
                .downloadUrl(shareUrl + "/download")
                .streamUrl(shareUrl + "/stream")
                .expiresAt(shareLink.getExpiresAt())
                .remainingSeconds(shareLink.getExpiresAt() != null
                        ? Math.max(0, Duration.between(LocalDateTime.now(), shareLink.getExpiresAt()).getSeconds())
                        : null)
                .expired(false)
                .file(dto)
                .build();
    }

    private Duration parseDuration(String expiryDuration) {
        if (expiryDuration == null) {
            return Duration.ofHours(24);
        }

        return switch (expiryDuration.toLowerCase()) {
            case "1h", "1 hour", "hour" -> Duration.ofHours(1);
            case "7d", "7 days", "week" -> Duration.ofDays(7);
            case "24h", "24 hours", "day" -> Duration.ofHours(24);
            default -> Duration.ofHours(24);
        };
    }
}