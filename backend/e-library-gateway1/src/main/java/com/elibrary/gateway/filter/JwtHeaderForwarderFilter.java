package com.elibrary.gateway.filter;

import java.security.Key;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import reactor.core.publisher.Mono;

@Component
public class JwtHeaderForwarderFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(JwtHeaderForwarderFilter.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    // This method defines the filter logic.
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext() // Get the reactive security context
                .filter(context -> context.getAuthentication() != null && context.getAuthentication().isAuthenticated()) // Only proceed if authenticated
                .flatMap(context -> {
                    Authentication authentication = context.getAuthentication();
                    String username = authentication.getName(); // User's email (subject from JWT)
                    List<String> roles = authentication.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .collect(Collectors.toList());

                    // The raw JWT token is usually available as credentials if you passed it that way
                    String jwtToken = null;
                    if (authentication.getCredentials() instanceof String) {
                        jwtToken = (String) authentication.getCredentials();
                    } else if (authentication.getCredentials() instanceof UsernamePasswordAuthenticationToken) {
                         // Sometimes the principal itself is the token or needs more specific handling
                         // This path depends on your ReactiveAuthenticationManager implementation
                         // For simplicity, let's just get the token from header again if needed for claims.
                         String header = exchange.getRequest().getHeaders().getFirst("Authorization");
                         if (header != null && header.startsWith("Bearer ")) {
                             jwtToken = header.substring(7);
                         }
                    }

                    String userId = ""; // Default empty string
                    if (jwtToken != null) {
                        try {
                            Claims claims = Jwts.parser().setSigningKey(key()).build().parseClaimsJws(jwtToken).getBody();
                            Object userIdClaim = claims.get("id");
                            if (userIdClaim instanceof Number) {
                                userId = String.valueOf(userIdClaim);
                            } else if (userIdClaim instanceof String && !((String) userIdClaim).isEmpty()) {
                                userId = (String) userIdClaim;
                            }
                            logger.debug("Gateway: Extracted ID: {} from JWT for user: {}", userId, username);
                        } catch (Exception e) {
                            logger.warn("Gateway: Failed to extract ID from JWT claims in JwtHeaderForwarderFilter for user {}: {}", username, e.getMessage());
                        }
                    } else {
                         logger.warn("Gateway: No JWT token available as credentials for user {}. Cannot extract ID.", username);
                    }
                    
                    System.out.println("============================================================================================================");
                    System.out.println(userId);
                    System.out.println("==============================================================================================================");

                    // Build the new request with forwarded headers
                    ServerHttpRequest request = exchange.getRequest().mutate()
                            .header("X-User-ID", userId)
                            .header("X-User-Email", username)
                            .header("X-User-Roles", String.join(",", roles))
                            .build();

                    logger.debug("Gateway: Forwarding request with X-User-ID:[{}], X-User-Email:[{}], X-User-Roles:[{}]", userId, username, roles);
                    return chain.filter(exchange.mutate().request(request).build()); // Pass the mutated request down the chain
                })
                .switchIfEmpty(chain.filter(exchange).then(Mono.empty())) // If not authenticated, just continue without adding headers
                .then(); // Ensure the Mono completes
    }

    // This defines the order of the filter. Lower values run earlier.
    // It should run after Spring Security's authentication filters, but before routing.
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 1; // Run after highest precedence, allowing authentication to complete.
        // You can experiment with different orders relative to SecurityWebFiltersOrder.AUTHENTICATION
        // For example, SecurityWebFiltersOrder.AUTHENTICATION.getOrder() + 1
    }

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }
}