package in.yashsarvaiya.cloudshareapi.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "share_links")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class ShareLinkDocument {
    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    @Indexed
    private String fileId;

    @Indexed
    private String clerkId;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime lastAccessedAt;
    private Integer accessCount;
}