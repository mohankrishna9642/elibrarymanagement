package com.elibrary.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ELibraryGateway1Application {

	public static void main(String[] args) {
		SpringApplication.run(ELibraryGateway1Application.class, args);
	}

}
