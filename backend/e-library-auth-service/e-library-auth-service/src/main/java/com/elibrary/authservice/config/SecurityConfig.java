package com.elibrary.authservice.config;

import com.elibrary.authservice.entity.Role;
import com.elibrary.authservice.entity.User;
import com.elibrary.authservice.repository.UserRepository;
import com.elibrary.authservice.repository.RoleRepository;
import com.elibrary.authservice.security.jwt.AuthEntryPointJwt;
import com.elibrary.authservice.security.jwt.AuthTokenFilter;
import com.elibrary.authservice.security.services.UserDetailsServiceImpl;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// ADD THESE IMPORTS FOR CORS
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import java.util.Arrays;
import org.springframework.security.config.Customizer; // Ensure this is imported for http.cors(Customizer.withDefaults())


import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService, AuthEntryPointJwt unauthorizedHandler,
                          UserRepository userRepository, RoleRepository roleRepository) {
        this.userDetailsService = userDetailsService;
        this.unauthorizedHandler = unauthorizedHandler;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults()) // <--- ADD THIS LINE TO ENABLE CORS FILTER INTEGRATION
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authorize -> authorize
                // 1. Core Public Endpoints
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/api/auth/register").permitAll()
                .requestMatchers("/actuator/**").permitAll()

                // 2. Auth Service's OWN Swagger UI (direct access on 8081)
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

                // 3. Auth Service's Swagger UI when accessed VIA THE GATEWAY (on 8080)
                .requestMatchers("/api/auth/swagger-ui.html", "/api/auth/swagger-ui/**", "/api/auth/v3/api-docs/**").permitAll()

                // ALL OTHER REQUESTS require authentication.
                .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ADD THIS NEW BEAN FOR CORS CONFIGURATION
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true); // Allow sending cookies/auth headers
        // Set the origins from which requests are allowed.
        // "http://localhost:3000" is for your React frontend.
        // "http://localhost:8080" is for your API Gateway's Swagger UI (if hosted directly there).
        // "http://192.168.68.103:8081" (or whatever IP is shown in your Swagger UI's server URL)
        // is needed if the browser is trying to hit that specific IP.
        config.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:8080",
            "http://192.168.68.103:8081" // Include the specific IP if that's the origin in the error
        ));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-User-ID", "X-User-Email", "X-User-Roles"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        config.setMaxAge(3600L); // How long the pre-flight request can be cached

        source.registerCorsConfiguration("/**", config); // Apply CORS config to all paths
        return new CorsFilter(source);
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (roleRepository.findByName(Role.RoleName.ROLE_USER).isEmpty()) {
                roleRepository.save(new Role(null, Role.RoleName.ROLE_USER));
            }
            if (roleRepository.findByName(Role.RoleName.ROLE_ADMIN).isEmpty()) {
                roleRepository.save(new Role(null, Role.RoleName.ROLE_ADMIN));
            }

            if (userRepository.findByEmail("admin@elibrary.com").isEmpty()) {
                Role adminRole = roleRepository.findByName(Role.RoleName.ROLE_ADMIN)
                        .orElseThrow(() -> new RuntimeException("Admin Role not found."));
                Set<Role> adminRoles = new HashSet<>();
                adminRoles.add(adminRole);

                User adminUser = new User();
                adminUser.setEmail("admin@elibrary.com");
                adminUser.setPassword(passwordEncoder.encode("adminpass"));
                adminUser.setName("Admin User");
                adminUser.setRegistrationDate(LocalDateTime.now());
                adminUser.setAccountNonLocked(true);
                adminUser.setRoles(adminRoles);
                userRepository.save(adminUser);
                System.out.println("Default Admin user created: admin@elibrary.com / adminpass");
            }
        };
    }
}