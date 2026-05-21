package in.yashsarvaiya.cloudshareapi.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CloudinaryUploadResponse {
    private final String publicId;
    private final String secureUrl;
    private final String resourceType;
    private final String originalFilename;
    private final String contentType;
    private final Long bytes;
}