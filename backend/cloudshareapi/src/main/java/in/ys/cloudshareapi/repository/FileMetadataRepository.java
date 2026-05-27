package in.yashsarvaiya.cloudshareapi.repository;

import in.yashsarvaiya.cloudshareapi.document.FileMetadataDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface FileMetadataRepository extends MongoRepository<FileMetadataDocument,String > {

    List<FileMetadataDocument> findByClerkId(String clerkId);
    Long countByClerkId(String clerkId);
    FileMetadataDocument findByPublicId(String publicId);
    java.util.List<FileMetadataDocument> findByPublicIdContaining(String fragment);
    java.util.List<FileMetadataDocument> findByNameContaining(String fragment);
    Optional<FileMetadataDocument> findTopByClerkIdAndNameAndFolderPathOrderByUploadedAtDesc(String clerkId, String name, String folderPath);
}
