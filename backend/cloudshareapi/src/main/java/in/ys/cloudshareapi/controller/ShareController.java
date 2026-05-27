package in.yashsarvaiya.cloudshareapi.controller;

import in.yashsarvaiya.cloudshareapi.dto.ShareLinkCreateRequest;
import in.yashsarvaiya.cloudshareapi.service.ShareLinkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;

@RestController
@RequiredArgsConstructor
@RequestMapping("/share")
public class ShareController {

    private final ShareLinkService shareLinkService;

    @PostMapping("/create")
    public ResponseEntity<?> createShareLink(@RequestBody ShareLinkCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shareLinkService.createShareLink(request));
    }

    @GetMapping("/{token}")
    public ResponseEntity<?> getSharedFile(@PathVariable String token) {
        return ResponseEntity.ok(shareLinkService.resolveShareLink(token));
    }

    @GetMapping("/{token}/stream")
    public ResponseEntity<?> streamSharedFile(@PathVariable String token) throws IOException {
        return proxySharedFile(token, false);
    }

    @GetMapping("/{token}/download")
    public ResponseEntity<?> downloadSharedFile(@PathVariable String token) throws IOException {
        return proxySharedFile(token, true);
    }

    private ResponseEntity<?> proxySharedFile(String token, boolean attachment) throws IOException {
        var response = shareLinkService.resolveShareLink(token);
        var file = response.getFile();
        if (file == null || file.getFileLocation() == null) {
            return ResponseEntity.notFound().build();
        }

        URL url = URI.create(file.getFileLocation()).toURL();
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(30000);
        connection.connect();

        int status = connection.getResponseCode();
        if (status >= 400) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }

        InputStream body = connection.getInputStream();
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            if (connection.getContentType() != null) {
                mediaType = MediaType.parseMediaType(connection.getContentType());
            }
        } catch (Exception ignored) {
        }

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, (attachment ? "attachment" : "inline") + "; filename=\"" + file.getName() + "\"")
                .header("X-Frame-Options", "ALLOWALL");

        return builder.body(new org.springframework.core.io.InputStreamResource(body));
    }
}