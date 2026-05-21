package in.yashsarvaiya.cloudshareapi.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class CloudinaryBatchUploadResponse {
    private final int uploadedCount;
    private final List<CloudinaryUploadResponse> files;
}