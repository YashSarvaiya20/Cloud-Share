package in.yashsarvaiya.cloudshareapi.controller;

import in.yashsarvaiya.cloudshareapi.document.UserCredits;
import in.yashsarvaiya.cloudshareapi.dto.FileMetadataDTO;
import in.yashsarvaiya.cloudshareapi.service.CloudinaryService;
import in.yashsarvaiya.cloudshareapi.service.FileMetadataService;
import in.yashsarvaiya.cloudshareapi.service.UserCreditsService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import org.bson.types.ObjectId;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/files")
public class FileController {

    private final FileMetadataService fileMetadataService;
    private final UserCreditsService userCreditsService;
    private final CloudinaryService cloudinaryService;

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadFiles(
            @RequestParam("files") MultipartFile[] files
            ,@RequestParam(value = "paths", required = false) List<String> paths
        ) {

       // System.out.println("🔥 FILE UPLOAD CONTROLLER HIT 🔥");

        Map<String, Object> response = new HashMap<>();

        List<FileMetadataDTO> list = fileMetadataService.uploadFiles(files, paths);
        UserCredits finalCredits = userCreditsService.getUserCredits();

        response.put("files", list);
        response.put("remainingCredits", finalCredits.getCredits());

        return ResponseEntity.ok(response);
    }
    @GetMapping("/my")
    public ResponseEntity<?> getFilesForCurrentUser(){
       List<FileMetadataDTO> files= fileMetadataService.getFiles();
       return ResponseEntity.ok(files);
    }
    @GetMapping("/public/{id}")
    public ResponseEntity<?> getPublicFile(@PathVariable String id){
        FileMetadataDTO file=fileMetadataService.getPublicFile(id);
        return ResponseEntity.ok(file);
    }

    @GetMapping("/view/{id}")
    public ResponseEntity<?> getViewableFile(@PathVariable String id){
        FileMetadataDTO file = fileMetadataService.getViewableFile(id);
        return ResponseEntity.ok(file);
    }

    // DEBUG: resolve an id/publicId to the stored DTO (useful to verify which id the server resolves)
    @GetMapping("/debug/{id}")
    public ResponseEntity<?> debugResolve(@PathVariable String id){
        try {
            System.out.println("DEBUG resolve request for id: " + id);
            FileMetadataDTO file = fileMetadataService.getDownloadableFileByAnyId(id);
            return ResponseEntity.ok(file);
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode()).body(Map.of("error", rse.getReason()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "internal"));
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> download(@PathVariable String id) throws IOException {
        FileMetadataDTO downloadableFile=fileMetadataService.getDownloadableFile(id);
       Resource resource = resolveDownloadResource(downloadableFile.getFileLocation());

       if (!resource.exists() || !resource.isReadable()) {
           throw new ResponseStatusException(NOT_FOUND, "File not found");
       }

       return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
               .header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+downloadableFile.getName()+"\"")
               .body(resource);
    }

    @GetMapping({"/stream/{publicId:.+}", "/stream/**"})
    public ResponseEntity<Resource> stream(HttpServletRequest request, @PathVariable(required = false) String publicId) throws IOException {
        try {
            String rawPath = request.getRequestURI();
            String requestPath = rawPath;
            String contextPath = request.getContextPath();
            if (requestPath != null && contextPath != null && requestPath.startsWith(contextPath)) {
                requestPath = requestPath.substring(contextPath.length());
            }
            String resolvedPath = requestPath;
            int streamIndex = resolvedPath.indexOf("/stream/");
            if (streamIndex >= 0) {
                resolvedPath = resolvedPath.substring(streamIndex + "/stream/".length());
            } else if (publicId != null) {
                resolvedPath = publicId;
            }
            String incomingPublicId = resolvedPath;
            if (incomingPublicId == null || incomingPublicId.isBlank()) {
                incomingPublicId = publicId;
            }
            if (incomingPublicId == null || incomingPublicId.isBlank()) {
                throw new ResponseStatusException(NOT_FOUND, "File not found");
            }

            System.out.println("STREAM REQUEST PUBLIC_ID: " + incomingPublicId);
            String decodedPublicId = java.net.URLDecoder.decode(incomingPublicId, java.nio.charset.StandardCharsets.UTF_8);
            System.out.println("Decoded publicId: " + decodedPublicId);
            FileMetadataDTO downloadableFile = fileMetadataService.getDownloadableFileByPublicId(decodedPublicId);
            System.out.println("Resolved document for stream: publicId=" + downloadableFile.getPublicId() + ", fileLocation=" + downloadableFile.getFileLocation());
            String location = downloadableFile.getFileLocation();
            System.out.println("Resolved Cloudinary URL: " + location);

            // If the fileLocation is a remote URL (Cloudinary), proxy it server-side
            if (location != null && (location.startsWith("http://") || location.startsWith("https://"))) {
                ResponseEntity<Resource> proxied = proxyRemoteUrl(location, downloadableFile.getName());
                if (proxied != null) {
                    return proxied;
                }

                for (String candidateUrl : cloudinaryService.buildPreviewUrlCandidates(downloadableFile)) {
                    if (candidateUrl == null || candidateUrl.equals(location)) {
                        continue;
                    }
                    System.out.println("Trying Cloudinary fallback URL: " + candidateUrl);
                    proxied = proxyRemoteUrl(candidateUrl, downloadableFile.getName());
                    if (proxied != null) {
                        return proxied;
                    }
                }

                System.out.println("All remote proxy attempts failed for publicId=" + downloadableFile.getPublicId());
                return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_GATEWAY).build();
            }

            Resource resource = resolveDownloadResource(location);

            System.out.println("Resolved local resource: " + resource.getFilename() + " (exists=" + resource.exists() + ", readable=" + resource.isReadable() + ")");

            if (!resource.exists() || !resource.isReadable()) {
                System.out.println("Local resource not found or not readable for location=" + location);
                return ResponseEntity.status(NOT_FOUND).build();
            }

            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            try {
                if (downloadableFile.getType() != null) {
                    mediaType = MediaType.parseMediaType(downloadableFile.getType());
                }
            } catch (Exception ignored) {}

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + downloadableFile.getName() + "\"")
                    .header("X-Frame-Options", "ALLOWALL")
                    .body(resource);
        } catch (ResponseStatusException rse) {
            // known 4xx from service layer (file not found / forbidden)
            return ResponseEntity.status(rse.getStatusCode()).build();
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private Resource resolveDownloadResource(String rawLocation) throws IOException {
        if (rawLocation != null && (rawLocation.startsWith("http://") || rawLocation.startsWith("https://"))) {
            return new UrlResource(URI.create(rawLocation));
        }

        Path original = Paths.get(rawLocation);
        List<Path> candidates = new ArrayList<>();
        candidates.add(original);

        if (original.getFileName() != null) {
            candidates.add(Paths.get("upload").resolve(original.getFileName()));
            candidates.add(Paths.get("uploads").resolve(original.getFileName()));
        }

        for (Path candidate : candidates) {
            Path normalized = candidate.toAbsolutePath().normalize();
            if (normalized.toFile().exists() && normalized.toFile().canRead()) {
                return new UrlResource(normalized.toUri());
            }
        }

        return new UrlResource(original.toAbsolutePath().normalize().toUri());
    }

    private ResponseEntity<Resource> proxyRemoteUrl(String remoteUrl, String fileName) {
        try {
            URL url = new URL(remoteUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(30000);
            conn.connect();

            int status = conn.getResponseCode();
            System.out.println("Remote fetch status=" + status + " for url=" + remoteUrl);
            if (status >= 400) {
                System.out.println("Remote fetch failed with status " + status + " for url=" + remoteUrl);
                return null;
            }

            String contentTypeStr = conn.getContentType();
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            try {
                if (contentTypeStr != null) mediaType = MediaType.parseMediaType(contentTypeStr);
            } catch (Exception ignored) {}

            long contentLength = conn.getContentLengthLong();
            InputStreamResource inputStreamResource = new InputStreamResource(conn.getInputStream());

            ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .header("X-Frame-Options", "ALLOWALL");

            if (contentLength > 0) builder.contentLength(contentLength);

            return builder.body(inputStreamResource);
        } catch (IOException ex) {
            System.out.println("Remote fetch IO error for url=" + remoteUrl + " -> " + ex.getMessage());
            return null;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable String id){
        fileMetadataService.deleteFile(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-public")
    public  ResponseEntity<?> togglePublic(@PathVariable String id){
       FileMetadataDTO file= fileMetadataService.togglePublic(id);
       return ResponseEntity.ok(file);
    }

    // Versioning endpoints removed
}
