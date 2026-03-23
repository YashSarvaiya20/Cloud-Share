package in.yashsarvaiya.cloudshareapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaymentDTO {

    private String planId;

    private Integer amount;     // ✅ wrapper
    private String currency;

    private Integer credits;    // ✅ wrapper

    private Boolean success;
    private String message;
    private String orderId;
    private Integer creditsAdded;
    private Integer newCreditBalance;
}
