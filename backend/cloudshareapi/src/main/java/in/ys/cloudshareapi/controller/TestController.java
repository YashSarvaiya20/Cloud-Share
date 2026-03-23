package in.yashsarvaiya.cloudshareapi.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/test")
public class TestController {

    @PostMapping(
            value = "/upload",
            consumes = "multipart/form-data"
    )
    public String testUpload(@RequestParam("files") MultipartFile[] files) {
        return "FILES = " + files.length;
    }
}

