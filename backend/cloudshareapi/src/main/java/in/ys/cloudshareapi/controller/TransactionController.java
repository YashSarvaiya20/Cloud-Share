package in.yashsarvaiya.cloudshareapi.controller;

import in.yashsarvaiya.cloudshareapi.document.PaymentTransaction;
import in.yashsarvaiya.cloudshareapi.document.ProfileDocument;
import in.yashsarvaiya.cloudshareapi.repository.PaymentTransactionRepository;
import in.yashsarvaiya.cloudshareapi.service.ProfileService;
import in.yashsarvaiya.cloudshareapi.service.UserCreditsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ProfileService profileService;
    private final UserCreditsService userCreditsService;

    /**
     * Get all SUCCESS transactions of current logged-in user
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserTransactions() {

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

        if (transactions.isEmpty()) {
            List<PaymentTransaction> anonymousTransactions =
                paymentTransactionRepository
                    .findByClerkIdAndStatusOrderByTransactionDateDesc(
                        "anonymousUser",
                        "SUCCESS"
                    );

            if (!anonymousTransactions.isEmpty()) {
            int creditsToMigrate = 0;
            for (PaymentTransaction tx : anonymousTransactions) {
                tx.setClerkId(clerkId);
                creditsToMigrate += tx.getCreditsAdded();
            }

            paymentTransactionRepository.saveAll(anonymousTransactions);
            userCreditsService.addCredits(clerkId, creditsToMigrate);
            transactions = anonymousTransactions;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("transactions", transactions);
        return ResponseEntity.ok(response);
    }
}
