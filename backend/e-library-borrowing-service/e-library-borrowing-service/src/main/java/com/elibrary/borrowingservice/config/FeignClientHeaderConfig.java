
  package com.elibrary.borrowingservice.config;
  
  import
  org.springframework.context.annotation.Bean;
import
  org.springframework.context.annotation.Configuration;
import
  org.springframework.web.context.request.RequestContextHolder;
import
  org.springframework.web.context.request.ServletRequestAttributes;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import
  jakarta.servlet.http.HttpServletRequest;
  
  @Configuration public class FeignClientHeaderConfig {
  
  @Bean public RequestInterceptor userHeadersForwardingInterceptor() { return
  new RequestInterceptor() {
  
  @Override public void apply(RequestTemplate template) {
  ServletRequestAttributes attributes = (ServletRequestAttributes)
  RequestContextHolder.getRequestAttributes();
  
  if (attributes != null) { HttpServletRequest request =
  attributes.getRequest();
  
  String userId = request.getHeader("X-User-ID"); String userEmail =
  request.getHeader("X-User-Email"); String userRoles =
  request.getHeader("X-User-Roles");
  
  if (userId != null) { template.header("X-User-ID", userId); } if (userEmail
  != null) { template.header("X-User-Email", userEmail); } if (userRoles !=
  null) { template.header("X-User-Roles", userRoles); } } } }; } }
 