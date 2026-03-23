package in.yashsarvaiya.cloudshareapi.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import in.yashsarvaiya.cloudshareapi.document.PaymentTransaction;
import in.yashsarvaiya.cloudshareapi.document.ProfileDocument;
import in.yashsarvaiya.cloudshareapi.dto.PaymentDTO;
import in.yashsarvaiya.cloudshareapi.dto.PaymentVerificationDTO;
import in.yashsarvaiya.cloudshareapi.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final ProfileService profileService;
    private final UserCreditsService userCreditsService;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    // =========================
    // CREATE ORDER
    // =========================
    public PaymentDTO createOrder(PaymentDTO paymentDTO) {
        try {
            ProfileDocument profile = profileService.getCurrentProfile();
            String clerkId = profile.getClerkId();

            RazorpayClient razorpayClient =
                    new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", paymentDTO.getAmount() * 100); // ₹ → paise
            orderRequest.put("currency", paymentDTO.getCurrency());
            orderRequest.put("receipt", "order_" + System.currentTimeMillis());

            Order order = razorpayClient.orders.create(orderRequest);
            String orderId = order.get("id");

            PaymentTransaction transaction = PaymentTransaction.builder()
                    .clerkId(clerkId)
                    .orderId(orderId)
                    .planId(paymentDTO.getPlanId())
                    .amount(paymentDTO.getAmount())
                    .currency(paymentDTO.getCurrency())
                    .status("PENDING")
                    .transactionDate(LocalDateTime.now())
                    .userEmail(
                            profile.getEmail() != null
                                    ? profile.getEmail()
                                    : "N/A"
                    )
                    .userName(
                            (profile.getFirstName() != null
                                    ? profile.getFirstName()
                                    : "")
                                    +
                                    (profile.getLastName() != null
                                            ? " " + profile.getLastName()
                                            : "")
                    )
                    .build();

            paymentTransactionRepository.save(transaction);

            return PaymentDTO.builder()
                    .orderId(orderId)
                    .success(true)
                    .message("Order created successfully")
                    .build();

        } catch (Exception e) {
            return PaymentDTO.builder()
                    .success(false)
                    .message("Error creating order: " + e.getMessage())
                    .build();
        }
    }

    // =========================
    // VERIFY PAYMENT
    // =========================
    public PaymentDTO verifyPayment(PaymentVerificationDTO request) {
        try {
                        ProfileDocument currentProfile = profileService.getCurrentProfile();
                        String currentClerkId = currentProfile.getClerkId();

            PaymentTransaction transaction =
                    paymentTransactionRepository
                            .findByOrderId(request.getRazorpay_order_id())
                            .orElseThrow(() ->
                                    new RuntimeException("Transaction not found"));

                        boolean wasAnonymousTransaction = "anonymousUser".equals(transaction.getClerkId());

                        if (!currentClerkId.equals(transaction.getClerkId())) {
                                transaction.setClerkId(currentClerkId);
                                paymentTransactionRepository.save(transaction);
                        }

            // Prevent double credit
            if ("SUCCESS".equals(transaction.getStatus())) {
                                if (wasAnonymousTransaction && transaction.getCreditsAdded() > 0) {
                                        userCreditsService.addCredits(currentClerkId, transaction.getCreditsAdded());
                                }

                                int currentCredits = userCreditsService
                                                .getUserCredits(currentClerkId)
                                                .getCredits();

                return PaymentDTO.builder()
                        .success(true)
                        .message("Payment already verified")
                        .credits(currentCredits)
                        .creditsAdded(transaction.getCreditsAdded())
                        .newCreditBalance(currentCredits)
                        .build();
            }

            String data =
                    request.getRazorpay_order_id()
                            + "|" + request.getRazorpay_payment_id();

            String generatedSignature =
                    generateHmacSha256Signature(data, razorpayKeySecret);

            if (!generatedSignature.equals(request.getRazorpay_signature())) {
                updateTransactionStatus(
                        request.getRazorpay_order_id(),
                        "FAILED",
                        request.getRazorpay_payment_id(),
                        null
                );
                return PaymentDTO.builder()
                        .success(false)
                        .message("Payment signature verification failed")
                        .build();
            }

            int credits;
            String plan;

            switch (request.getPlanId()) {
                case "premium":
                    credits = 500;
                    plan = "PREMIUM";
                    break;
                case "ultimate":
                    credits = 5000;
                    plan = "ULTIMATE";
                    break;
                default:
                    updateTransactionStatus(
                            request.getRazorpay_order_id(),
                            "FAILED",
                            request.getRazorpay_payment_id(),
                            null
                    );
                    return PaymentDTO.builder()
                            .success(false)
                            .message("Invalid plan selected")
                            .build();
            }

            userCreditsService.addCredits(
                    currentClerkId,
                    credits,
                    plan
            );

            updateTransactionStatus(
                    request.getRazorpay_order_id(),
                    "SUCCESS",
                    request.getRazorpay_payment_id(),
                    credits
            );

            int updatedCredits = userCreditsService
                    .getUserCredits(currentClerkId)
                    .getCredits();

            return PaymentDTO.builder()
                    .success(true)
                    .message("Payment verified and credits added")
                    .credits(updatedCredits)
                    .creditsAdded(credits)
                    .newCreditBalance(updatedCredits)
                    .build();

        } catch (Exception e) {
            return PaymentDTO.builder()
                    .success(false)
                    .message("Error verifying payment: " + e.getMessage())
                    .build();
        }
    }

    // =========================
    // UPDATE TRANSACTION
    // =========================
    private void updateTransactionStatus(
            String orderId,
            String status,
            String paymentId,
            Integer credits
    ) {
        paymentTransactionRepository.findByOrderId(orderId)
                .ifPresent(tx -> {
                    tx.setStatus(status);
                    tx.setPaymentId(paymentId);
                    if (credits != null) {
                        tx.setCreditsAdded(credits);
                    }
                    paymentTransactionRepository.save(tx);
                });
    }

    // =========================
    // HMAC SHA256
    // =========================
    private String generateHmacSha256Signature(String data, String secret)
            throws NoSuchAlgorithmException, InvalidKeyException {

        SecretKeySpec key =
                new SecretKeySpec(
                        secret.getBytes(StandardCharsets.UTF_8),
                        "HmacSHA256"
                );

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(key);

        return bytesToHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            String s = Integer.toHexString(0xff & b);
            if (s.length() == 1) hex.append('0');
            hex.append(s);
        }
        return hex.toString();
    }
}
