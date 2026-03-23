package in.yashsarvaiya.cloudshareapi.controller;


import in.yashsarvaiya.cloudshareapi.dto.ProfileDTO;
import in.yashsarvaiya.cloudshareapi.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    @PostMapping("/register")
    public ResponseEntity<?> registerProfile(@RequestBody ProfileDTO profileDTO){
        HttpStatus status= profileService.existsByClerkId(profileDTO.getClerkId()) ? HttpStatus.OK:HttpStatus.CREATED;
       ProfileDTO savedProfile= profileService.createProfile( profileDTO);

       return ResponseEntity.status(status).body(savedProfile);
    }

}
