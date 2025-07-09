package com.elibrary.gateway.config;

import java.security.Key;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.web.server.authentication.WebFilterChainServerAuthenticationSuccessHandler;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;

/*import org.springframework.security.web.server.SecurityWebFiltersOrder;*/
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers; 
import org.springframework.web.util.pattern.PathPatternParser;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
public class GatewayConfig {

    private static final Logger logger = LoggerFactory.getLogger(GatewayConfig.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    public PathPatternParser pathPatternParser() {
        PathPatternParser parser = new PathPatternParser();
        parser.setCaseSensitive(false);
        parser.setMatchOptionalTrailingSeparator(true);
        return parser;
    }

    private static final String[] GENERAL_PUBLIC_PATHS_ARRAY = {
        "/",
        "/api/auth/login",
        "/api/auth/register",
        "/actuator/**",
        "/swagger-ui.html",
        "/swagger-ui/**",
        "/v3/api-docs/**",
        "/api/auth/swagger-ui.html",
        "/api/auth/swagger-ui/**",
        "/api/auth/v3/api-docs/**",
        "/api/books/browse",
        "/books/**",
        "/api/books/swagger-ui.html",
        "/api/books/swagger-ui/**",
        "/api/books/v3/api-docs/**"
    };

    // Dedicated, very high precedence filter chain just for Borrowing Service Swagger
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE - 2)
    public static SecurityWebFilterChain borrowingServiceSwaggerFilterChain(ServerHttpSecurity http) {
        http
            .securityMatcher(ServerWebExchangeMatchers.pathMatchers(
                "/api/borrows/swagger-ui.html",
                "/api/borrows/swagger-ui/**",
                "/api/borrows/v3/api-docs/**",
                "/api/borrows/public-status"
            ))
            .authorizeExchange(exchanges -> exchanges.anyExchange().permitAll())
            .csrf(ServerHttpSecurity.CsrfSpec::disable);
            
        return (SecurityWebFilterChain) http.build(); // CRITICAL FIX: Explicit cast
    }

    // General public filter chain, runs after borrowingServiceSwaggerFilterChain
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE - 1)
    public static SecurityWebFilterChain generalPublicSecurityFilterChain(ServerHttpSecurity http) {
        http
            .securityMatcher(ServerWebExchangeMatchers.pathMatchers(GENERAL_PUBLIC_PATHS_ARRAY))
            .authorizeExchange(exchanges -> exchanges.anyExchange().permitAll())
            .csrf(ServerHttpSecurity.CsrfSpec::disable);
            
        return (SecurityWebFilterChain) http.build(); // CRITICAL FIX: Explicit cast
    }


    // Main security filter chain for authenticated requests
    @Bean
    public static SecurityWebFilterChain springSecurityFilterChain(
        ServerHttpSecurity http,
        @Qualifier("jwtAuthenticationFilter") WebFilter authenticationWebFilter
    ) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .httpBasic(Customizer.withDefaults())
            .formLogin(formLoginSpec -> formLoginSpec.disable())
            .logout(logoutSpec -> logoutSpec.disable())

            .authorizeExchange(exchanges -> exchanges
                .anyExchange().authenticated()
            )
            .securityContextRepository(NoOpServerSecurityContextRepository.getInstance());

        http.addFilterAt(authenticationWebFilter, SecurityWebFiltersOrder.AUTHENTICATION);

        return (SecurityWebFilterChain) http.build(); // CRITICAL FIX: Explicit cast
    }

    @Bean
    public ReactiveAuthenticationManager reactiveAuthenticationManager() {
        return authentication -> {
            String token = (String) authentication.getCredentials();
            try {
                Claims claims = Jwts.parser()
                        .setSigningKey(key())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                String username = claims.getSubject();
                List<String> roles = claims.get("roles", List.class);

                List<SimpleGrantedAuthority> authorities = roles.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

                return Mono.just(new UsernamePasswordAuthenticationToken(username, token, authorities));
            } catch (Exception e) {
                logger.error("Gateway: JWT validation failed in ReactiveAuthenticationManager: {}", e.getMessage());
                return Mono.empty();
            }
        };
    }

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    @Bean
    public AuthenticationWebFilter jwtAuthenticationFilter() {
        AuthenticationWebFilter filter = new AuthenticationWebFilter(reactiveAuthenticationManager());

        filter.setServerAuthenticationConverter(exchange -> {
            String header = exchange.getRequest().getHeaders().getFirst("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String authToken = header.substring(7);
                return Mono.just(new UsernamePasswordAuthenticationToken(authToken, authToken));
            }
            return Mono.empty();
        });

        return filter;
    }

    @Bean
    public ReactiveUserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        return username -> {
            if ("gatewayuser".equals(username)) {
                UserDetails user = User.withUsername("gatewayuser")
                        .password(passwordEncoder.encode("gatewaypass"))
                        .roles("GATEWAY_ADMIN")
                        .build();
                return Mono.just(user);
            }
            return Mono.empty();
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}