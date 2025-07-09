package com.elibrary.borrowingservice.feign;

import com.elibrary.borrowingservice.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service") // Name of the Auth Service in Eureka
public interface AuthClient {

    @GetMapping("/api/users/profile-by-id/{id}") // Endpoint in Auth Service to get user details by ID
    UserDto getUserProfileById(@PathVariable("id") Long id);
}