package in.yashsarvaiya.cloudshareapi.repository;

import in.yashsarvaiya.cloudshareapi.document.PaymentTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository
        extends MongoRepository<PaymentTransaction, String> {

    // ✅ Correct case: clerkId
    List<PaymentTransaction> findByClerkId(String clerkId);

    List<PaymentTransaction> findByClerkIdOrderByTransactionDateDesc(String clerkId);

    List<PaymentTransaction> findByClerkIdAndStatusOrderByTransactionDateDesc(
            String clerkId,
            String status
    );

    // ✅ Strongly recommended
    Optional<PaymentTransaction> findByOrderId(String orderId);
}
