package in.yashsarvaiya.cloudshareapi.controller;

import in.yashsarvaiya.cloudshareapi.document.UserCredits;
import in.yashsarvaiya.cloudshareapi.dto.FileMetadataDTO;
import in.yashsarvaiya.cloudshareapi.service.FileMetadataService;
import in.yashsarvaiya.cloudshareapi.service.UserCreditsService;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOError;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequiredArgsConstructor
@RequestMapping("/files")
public class FileController {

    private final FileMetadataService fileMetadataService;
    private final UserCreditsService userCreditsService;

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadFiles(
            @RequestParam("files") MultipartFile[] files
    ) throws IOException {

       // System.out.println("🔥 FILE UPLOAD CONTROLLER HIT 🔥");

        Map<String, Object> response = new HashMap<>();

        List<FileMetadataDTO> list = fileMetadataService.uploadFiles(files);
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

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> download(@PathVariable String id) throws IOException {
        System.out.println("🔥 FILE download CONTROLLER HIT 🔥");
        FileMetadataDTO downloadableFile=fileMetadataService.getDownloadableFile(id);
       Path path= Paths.get(downloadableFile.getFileLocation());
       Resource resource=new UrlResource(path.toUri());
       return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
               .header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+downloadableFile.getName()+"\"")
               .body(resource);
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
}
