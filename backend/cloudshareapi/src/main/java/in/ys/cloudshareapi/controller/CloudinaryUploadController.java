package in.yashsarvaiya.cloudshareapi.controller;

import in.yashsarvaiya.cloudshareapi.document.UserCredits;
import in.yashsarvaiya.cloudshareapi.dto.FileMetadataDTO;
import in.yashsarvaiya.cloudshareapi.service.FileMetadataService;
import in.yashsarvaiya.cloudshareapi.service.UserCreditsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/cloudinary")
@RequiredArgsConstructor
public class CloudinaryUploadController {

    private final FileMetadataService fileMetadataService;
    private final UserCreditsService userCreditsService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadFiles(@RequestParam("files") MultipartFile[] files) {
        List<FileMetadataDTO> uploadedFiles = fileMetadataService.uploadFiles(files);
        UserCredits finalCredits = userCreditsService.getUserCredits();

        Map<String, Object> response = new HashMap<>();
        response.put("files", uploadedFiles);
        response.put("remainingCredits", finalCredits.getCredits());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}