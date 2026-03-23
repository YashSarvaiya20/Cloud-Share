package in.yashsarvaiya.cloudshareapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FileMetadataDTO {
    private String id;
    private String name;
    private String type;
    private String clerkId;
    private Long size;
    private Boolean isPublic;
    private String fileLocation;
    private LocalDateTime uploadedAt;
}
