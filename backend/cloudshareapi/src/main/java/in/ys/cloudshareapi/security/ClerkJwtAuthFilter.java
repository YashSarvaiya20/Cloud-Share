package in.yashsarvaiya.cloudshareapi.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.PublicKey;
import java.util.Base64;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class ClerkJwtAuthFilter extends OncePerRequestFilter {

    @Value("${clerk.issuer}")
    private String clerkIssuer;

    private final ClerkJwksProvider jwksProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
            //System.out.println("From shouldnotfilter:"+uri);
//        System.out.println("URI = " + request.getRequestURI());
//        System.out.println("ContextPath = " + request.getContextPath());
//        System.out.println("ServletPath = " + request.getServletPath());

        return uri.startsWith("/api/v1.0/files/download/")
                ||uri.startsWith("/api/v1.0/webhooks/")
                || uri.startsWith("/api/v1.0/files/public/")
                || uri.startsWith("/api/v1.0/payments/")
               // || uri.startsWith("/api/v1.0/transactions/")
                || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
       // System.out.println("from filter"+authHeader);
       // System.out.println("JWT FILTER HIT → " + request.getRequestURI());

        // ✅ No token → continue
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 1️⃣ Extract token
            String token = authHeader.substring(7);
            String[] chunks = token.split("\\.");

            if (chunks.length < 3) {
                filterChain.doFilter(request, response);
                return;
            }

            // 2️⃣ Decode JWT header
            String headerJson =
                    new String(Base64.getUrlDecoder().decode(chunks[0]));
            JsonNode headerNode = objectMapper.readTree(headerJson);

            if (!headerNode.has("kid")) {
                filterChain.doFilter(request, response);
                return;
            }

            // 3️⃣ Fetch public key
            String kid = headerNode.get("kid").asText();
            PublicKey publicKey = jwksProvider.getPublicKey(kid);

            // 4️⃣ Verify JWT
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(publicKey)
                    .setAllowedClockSkewSeconds(60)
                    .requireIssuer(clerkIssuer)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String clerkUserId = claims.getSubject();

            // 5️⃣ Set authentication
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            clerkUserId,
                            null,
                            Collections.singletonList(
                                    new SimpleGrantedAuthority("ROLE_USER")
                            )
                    );

            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);

        } catch (Exception e) {
            // ❌ Do NOT block request
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
