package in.yashsarvaiya.cloudshareapi.controller;

import in.yashsarvaiya.cloudshareapi.document.PaymentTransaction;
import in.yashsarvaiya.cloudshareapi.document.ProfileDocument;
import in.yashsarvaiya.cloudshareapi.repository.PaymentTransactionRepository;
import in.yashsarvaiya.cloudshareapi.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ProfileService profileService;

    /**
     * Get all SUCCESS transactions of current logged-in user
     */
    @GetMapping
    public ResponseEntity<List<PaymentTransaction>> getUserTransactions() {

        // ✅ Get authenticated user
        ProfileDocument currentProfile = profileService.getCurrentProfile();
        String clerkId = currentProfile.getClerkId();

        // ✅ Fetch transactions (sorted latest first)
        List<PaymentTransaction> transactions =
                paymentTransactionRepository
                        .findByClerkIdAndStatusOrderByTransactionDateDesc(
                                clerkId,
                                "SUCCESS"
                        );

        return ResponseEntity.ok(transactions);
    }
}
