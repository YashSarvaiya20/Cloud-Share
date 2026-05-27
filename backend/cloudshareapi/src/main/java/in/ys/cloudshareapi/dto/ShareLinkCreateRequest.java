package in.yashsarvaiya.cloudshareapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareLinkCreateRequest {
    private String fileId;
    private String expiryDuration;
}