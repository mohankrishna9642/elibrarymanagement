E-Library Management System
Table of Contents
Introduction

Features

Architecture Overview

Technologies Used

Setup and Installation

Prerequisites

Backend Setup

Frontend Setup

Running the Application

API Endpoints (Swagger UI)

Default Credentials

Future Enhancements

Contributing

License

Introduction
This project is a comprehensive E-Library Management System built using a microservices architecture with Spring Boot for the backend and React for the frontend. It aims to provide a robust platform for managing digital books, user accounts, and borrowing processes.

Features
The application includes the following core functionalities:

User & Authentication Module:

User Registration (new users)

User Login (regular users and administrators)

Change Password

User Profile Management (view and update personal details)

Admin User Management (view, restrict, activate user accounts)

Book Management Module:

Add/Update Book (Admin only, including file upload for PDF/EPUB)

All Books List (Admin view with management actions)

Browse E-Books (User view with search and filter)

Read Online (access book files)

Borrowing & Reading Module:

Borrow Books (conditional based on availability, user limit, and overdue status)

Return Books (user-initiated and admin-initiated)

Borrow History (user's past and current borrowings)

All Borrowed Books Overview (Admin view)

Overdue Alerts (notifications for overdue books)

Dashboard Module:

Admin Dashboard (key metrics: total books, borrowed, overdue, active users)

User Dashboard (currently borrowed books, overdue alerts, quick links)

Architecture Overview
The application is designed with a microservices architecture to ensure scalability, maintainability, and fault tolerance.

graph TD
    User_UI[React Frontend] --> API_Gateway;

    subgraph Backend Services
        API_Gateway --> Auth_Service[Auth Service];
        API_Gateway --> Book_Service[Book Service];
        API_Gateway --> Borrowing_Service[Borrowing Service];

        Auth_Service --> Auth_DB[(Auth DB - MySQL)];
        Book_Service --> Book_DB[(Book DB - MySQL)];
        Borrowing_Service --> Borrowing_DB[(Borrowing DB - MySQL)];

        Auth_Service -- Registers --> Eureka_Server(Eureka Server);
        Book_Service -- Registers --> Eureka_Server;
        Borrowing_Service -- Registers --> Eureka_Server;
        API_Gateway -- Uses --> Eureka_Server;
    end

Eureka Server: Centralized service registry for microservices.

API Gateway (e-library-gateway): Single entry point for all client requests, handling routing, load balancing, and initial security.

Auth Service (auth-service): Manages user authentication, registration, and user profiles.

Book Service (book-service): Manages all book-related operations, including adding, updating, listing, and searching books, and handling file storage.

Borrowing Service (borrowing-service): Handles book borrowing and return processes, including overdue logic and limits, communicating with Auth and Book services.

MySQL Databases: Each service maintains its own dedicated database for data isolation.

Technologies Used
Backend
Language: Java (OpenJDK 17.0.1)

Framework: Spring Boot 3.5.0

Database: MySQL 8

ORM: Spring Data JPA

Security: Spring Security (JWT for authentication)

Service Discovery: Spring Cloud Netflix Eureka Client

API Gateway: Spring Cloud Gateway

Inter-service Communication: WebClient, Feign Client (for synchronous calls)

API Documentation: Springdoc OpenAPI (Swagger UI)

Utilities: Lombok (boilerplate code reduction), Spring Boot Starter Validation

Frontend
Framework: React JS

Styling: Pure CSS

Package Manager: npm 10.9.2

Routing: React Router DOM

HTTP Client: Axios

Development Environment: Node.js 22.16.0, VS Code / sts

Setup and Installation
Prerequisites
Before you begin, ensure you have the following installed:

Java Development Kit (JDK) 17.0.1

Apache Maven

MySQL 8 (and a MySQL client like MySQL Workbench or DBeaver)

Node.js 22.16.0 (includes npm 10.9.2)

Backend Setup
Clone the Repository (or create project structure manually):
Organize your microservices into separate folders, e.g., e-library-microservices/eureka-server, e-library-microservices/auth-service, etc.

MySQL Database Setup:
Open your MySQL client and create the necessary databases: elibrary_auth, elibrary_books, and elibrary_borrows.
Note: Table schemas will be automatically created by Spring Data JPA (ddl-auto: update) upon first run. Ensure your application.properties files for each service have the correct MySQL username and password.

Backend Project Configuration:
For each Spring Boot service (eureka-server, e-library-gateway, auth-service, book-service, borrowing-service), navigate into its directory and build the project using Maven.

File Upload Directory: In e-library-book-service, create a directory named uploads/books in the project root (e.g., e-library-microservices/e-library-book-service/uploads/books). This is where uploaded book files will be stored.

Frontend Setup
Navigate to the elibrary-frontend directory and install project dependencies.

Running the Application
Start the services in the following order:

MySQL Server: Ensure your MySQL server is running.

Backend Services: Start each Spring Boot application (eureka-server, auth-service, book-service, borrowing-service, e-library-gateway) by navigating to its directory and running mvn spring-boot:run.

Verify Eureka Dashboard at http://localhost:8761.

React Frontend:

cd elibrary-frontend
npm start

This will typically open the application in your browser at http://localhost:3000.

API Endpoints (Swagger UI)
You can explore the API endpoints using Swagger UI:

API Gateway Swagger: http://localhost:8080/swagger-ui.html (This will show aggregated APIs from all services)

Individual Service Swaggers (for direct testing, not via Gateway):

Auth Service: http://localhost:8081/swagger-ui.html

Book Service: http://localhost:8082/api/book/swagger-ui.html

Borrowing Service: http://localhost:8083/swagger-ui.html

Default Credentials
For initial testing, you can use the following admin credentials:

Future Enhancements
JWT Refresh Tokens: Implement a refresh token mechanism for longer user sessions without frequent re-login.

Centralized Logging & Monitoring: Integrate ELK stack (Elasticsearch, Logstash, Kibana) or Prometheus/Grafana for comprehensive logging and monitoring.

Distributed Tracing: Implement Spring Cloud Sleuth with Zipkin for tracing requests across microservices.

Circuit Breakers & Retries: Use Resilience4j to enhance fault tolerance for inter-service communication.

Asynchronous Communication: Implement message queues (e.g., RabbitMQ, Kafka) for asynchronous communication between services.

File Storage: Integrate with cloud storage solutions like AWS S3 or Azure Blob Storage for scalable and reliable book file storage.

Reminder Notifications: Develop a dedicated Notification Service for sending email/SMS reminders for due dates and overdue books.

Advanced Search & Filtering: Implement more sophisticated search capabilities, including full-text search.

User Dashboard Enhancements: Display actual borrowed books and overdue status dynamically from the Borrowing Service.

Admin Dashboard Metrics: Populate all metrics on the admin dashboard by aggregating data from relevant services.

Frontend UI/UX: Improve the overall user interface and user experience with more polished designs and interactive elements.

Contributing
Contributions are welcome! Please fork the repository and submit pull requests.

License
This project is licensed under the MIT License.
