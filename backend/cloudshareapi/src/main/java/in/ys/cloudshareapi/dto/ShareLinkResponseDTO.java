package in.yashsarvaiya.cloudshareapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareLinkResponseDTO {
    private String token;
    private String shareUrl;
    private String downloadUrl;
    private String streamUrl;
    private LocalDateTime expiresAt;
    private Long remainingSeconds;
    private boolean expired;
    private FileMetadataDTO file;
}