package in.yashsarvaiya.cloudshareapi.repository;

import in.yashsarvaiya.cloudshareapi.document.ProfileDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ProfileRepository extends MongoRepository<ProfileDocument, String> {

    Optional<ProfileDocument> findByEmail(String email);

    Optional<ProfileDocument> findByClerkId(String clerkId);

    boolean existsByClerkId(String clerkId);
}
