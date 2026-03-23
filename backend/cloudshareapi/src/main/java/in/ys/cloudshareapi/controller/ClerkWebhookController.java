package in.yashsarvaiya.cloudshareapi.controller;

import in.yashsarvaiya.cloudshareapi.dto.ProfileDTO;
import in.yashsarvaiya.cloudshareapi.service.ProfileService;
import in.yashsarvaiya.cloudshareapi.service.UserCreditsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/webhooks")
@RequiredArgsConstructor
public class ClerkWebhookController {

    private final UserCreditsService userCreditsService;
    private final ProfileService profileService;

    @Value("${clerk.webhook.secret}")
    private String webhookSecret;

    @PostMapping("/clerk")
    public ResponseEntity<String> handleClerkWebhook(
            @RequestHeader("svix-id") String svixId,
            @RequestHeader("svix-timestamp") String svixTimestamp,
            @RequestHeader("svix-signature") String svixSignature,
            @RequestBody String payload
    ) {
        System.out.println("🔥 WEBHOOK CONTROLLER HIT 🔥");

        try {
            // ✅ 1. Verify webhook signature
            boolean isValid = verifyWebHookSignature(
                    svixId, svixTimestamp, svixSignature, payload
            );

            if (!isValid) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid webhook signature");
            }

            // ✅ 2. Parse payload
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(payload);
            String eventType = rootNode.path("type").asText();
            JsonNode dataNode = rootNode.path("data");

            // ✅ 3. Handle events
            switch (eventType) {
                case "user.created" -> handleUserCreated(dataNode);
                case "user.updated" -> handleUserUpdated(dataNode);
                case "user.deleted" -> handleUserDeleted(dataNode);
                default -> {
                    // ignore other events
                }
            }

            // ✅ 4. ALWAYS return one response
            return ResponseEntity.ok("OK");

        } catch (Exception e) {
            // ❌ NEVER throw in webhook
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Webhook processing failed");
        }
    }

    // ===================== EVENT HANDLERS =====================

    private void handleUserCreated(JsonNode data) {
        String clerkId = data.path("id").asText();

        String email = "";
        JsonNode emailAddresses = data.path("email_addresses");
        if (emailAddresses.isArray() && emailAddresses.size() > 0) {
            email = emailAddresses.get(0)
                    .path("email_address")
                    .asText();
        }

        String firstName = data.path("first_name").asText("");
        String lastName = data.path("last_name").asText("");
        String photoUrl = data.path("image_url").asText("");

        ProfileDTO profile = ProfileDTO.builder()
                .clerkId(clerkId)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .photoUrl(photoUrl)
                .build();

        profileService.createProfile(profile);
        userCreditsService.createInitialCredits(clerkId);
    }

    private void handleUserUpdated(JsonNode data) {
        String clerkId = data.path("id").asText();

        String email = "";
        JsonNode emailAddresses = data.path("email_addresses");
        if (emailAddresses.isArray() && emailAddresses.size() > 0) {
            email = emailAddresses.get(0)
                    .path("email_address")
                    .asText();
        }

        String firstName = data.path("first_name").asText("");
        String lastName = data.path("last_name").asText("");
        String photoUrl = data.path("image_url").asText("");

        ProfileDTO updatedProfile = ProfileDTO.builder()
                .clerkId(clerkId)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .photoUrl(photoUrl)
                .build();

        ProfileDTO result = profileService.updateProfile(updatedProfile);
        if (result == null) {
            handleUserCreated(data);
        }
    }

    private void handleUserDeleted(JsonNode data) {
        String clerkId = data.path("id").asText();
        profileService.deleteProfile(clerkId);
    }

    // ===================== SIGNATURE VERIFICATION =====================

    private boolean verifyWebHookSignature(
            String svixId,
            String svixTimestamp,
            String svixSignature,
            String payload
    ) {
        // TODO: implement real verification later
        // For now, return true to unblock flow
        return true;
    }
}
