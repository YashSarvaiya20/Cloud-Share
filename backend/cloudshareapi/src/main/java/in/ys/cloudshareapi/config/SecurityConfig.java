package in.yashsarvaiya.cloudshareapi.config;

import in.yashsarvaiya.cloudshareapi.security.ClerkJwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // ✅ SAME AS YOUR FIRST VERSION
    private final ClerkJwtAuthFilter clerkJwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // ✅ CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ✅ CSRF OFF (API)
                .csrf(AbstractHttpConfigurer::disable)

                .authorizeHttpRequests(auth -> auth

                            .requestMatchers(HttpMethod.POST, "/payments/create-order").permitAll()
                        .requestMatchers("/payments/**").permitAll()
                            // ✅ PUBLIC ENDPOINTS
                        .requestMatchers("/webhooks/**").permitAll()
                        .requestMatchers("/api/v1.0/files/public/**").permitAll()
                        .requestMatchers("/api/v1.0/files/download/**").permitAll()

                            // ✅ PREFLIGHT
                   //     .requestMatchers("/transactions/").permitAll()
                            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 🔒 PROTECTED

                        .requestMatchers(HttpMethod.POST, "/api/v1.0/files/upload").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1.0/files/**").authenticated()

                        .anyRequest().authenticated()
                )

                // ✅ STATELESS API
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // ✅ ADD YOUR JWT FILTER
                .addFilterBefore(
                        clerkJwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);
        config.setAllowedOriginPatterns(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));
        config.setAllowedHeaders(List.of(
                "Authorization", "Content-Type", "Accept"
        ));
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
