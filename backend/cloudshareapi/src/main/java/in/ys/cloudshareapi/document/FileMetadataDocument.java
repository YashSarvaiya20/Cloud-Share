package in.yashsarvaiya.cloudshareapi.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "files")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class FileMetadataDocument {
    @Id
    private String id;
    private String name;
    private String type;
    private String clerkId;
    private Long size;
    private Boolean isPublic;
    private String fileLocation;
    private LocalDateTime uploadedAt;
}
