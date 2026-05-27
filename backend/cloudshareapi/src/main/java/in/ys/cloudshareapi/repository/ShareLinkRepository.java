package in.yashsarvaiya.cloudshareapi.repository;

import in.yashsarvaiya.cloudshareapi.document.ShareLinkDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShareLinkRepository extends MongoRepository<ShareLinkDocument, String> {
    Optional<ShareLinkDocument> findByToken(String token);
    List<ShareLinkDocument> findByExpiresAtBefore(LocalDateTime time);
    void deleteByExpiresAtBefore(LocalDateTime time);
}