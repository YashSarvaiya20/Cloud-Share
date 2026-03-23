package in.yashsarvaiya.cloudshareapi.service;

import com.mongodb.DuplicateKeyException;
import in.yashsarvaiya.cloudshareapi.document.ProfileDocument;
import in.yashsarvaiya.cloudshareapi.dto.ProfileDTO;
import in.yashsarvaiya.cloudshareapi.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;

    // ---------------- CREATE OR UPDATE PROFILE ----------------
    public ProfileDTO createProfile(ProfileDTO profileDTO) {

        // If profile already exists → update
        if (profileRepository.existsByClerkId(profileDTO.getClerkId())) {
            return updateProfile(profileDTO);
        }

        // ✅ DECLARE builder properly
        ProfileDocument.ProfileDocumentBuilder builder =
                ProfileDocument.builder()
                        .clerkId(profileDTO.getClerkId())
                        .firstName(profileDTO.getFirstName())
                        .lastName(profileDTO.getLastName())
                        .photoUrl(profileDTO.getPhotoUrl())
                        .credits(5)
                        .createdAt(Instant.now());

        // ✅ ONLY set email if present
        if (profileDTO.getEmail() != null && !profileDTO.getEmail().isBlank()) {
            builder.email(profileDTO.getEmail());
        }

        ProfileDocument profile;

        try {
            profile = profileRepository.save(builder.build());
        } catch (DuplicateKeyException e) {
            throw new RuntimeException("Profile already exists with same email");
        }

        return mapToDTO(profile);
    }


    // ---------------- UPDATE PROFILE ----------------
    public ProfileDTO updateProfile(ProfileDTO profileDTO) {

        ProfileDocument existingProfile = profileRepository
                .findByClerkId(profileDTO.getClerkId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                NOT_FOUND,
                                "Profile not found"
                        )
                );

        if (profileDTO.getEmail() != null && !profileDTO.getEmail().isEmpty()) {
            existingProfile.setEmail(profileDTO.getEmail());
        }
        if (profileDTO.getFirstName() != null && !profileDTO.getFirstName().isEmpty()) {
            existingProfile.setFirstName(profileDTO.getFirstName());
        }
        if (profileDTO.getLastName() != null && !profileDTO.getLastName().isEmpty()) {
            existingProfile.setLastName(profileDTO.getLastName());
        }
        if (profileDTO.getPhotoUrl() != null && !profileDTO.getPhotoUrl().isEmpty()) {
            existingProfile.setPhotoUrl(profileDTO.getPhotoUrl());
        }

        profileRepository.save(existingProfile);
        return mapToDTO(existingProfile);
    }

    // ---------------- DELETE PROFILE ----------------
    public void deleteProfile(String clerkId) {
        profileRepository.findByClerkId(clerkId)
                .ifPresent(profileRepository::delete);
    }
    public boolean existsByClerkId(String clerkId) {
        return profileRepository.existsByClerkId(clerkId);
    }


    // ---------------- GET CURRENT PROFILE (🔥 KEY FIX 🔥) ----------------
    public ProfileDocument getCurrentProfile() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UsernameNotFoundException("User not authenticated");
        }

        String clerkId = authentication.getName();

        // AUTO-CREATE PROFILE IF NOT EXISTS
        return profileRepository.findByClerkId(clerkId)
                .orElseGet(() -> {
                    ProfileDocument profile = ProfileDocument.builder()
                            .clerkId(clerkId)
                            .credits(5)
                            .createdAt(Instant.now())
                            .build();

                    return profileRepository.save(profile);
                });
    }

    // ---------------- HELPER METHOD ----------------
    private ProfileDTO mapToDTO(ProfileDocument profile) {
        return ProfileDTO.builder()
                .id(profile.getId())
                .clerkId(profile.getClerkId())
                .email(profile.getEmail())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .photoUrl(profile.getPhotoUrl())
                .credits(profile.getCredits())
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
