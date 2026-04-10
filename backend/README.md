# Backend – Smart Campus Operations Hub

This is the Spring Boot backend for the **Smart Campus Operations Hub** project.

## Technologies Used

- Spring Boot
- Spring Web
- Spring Security
- Spring Data MongoDB
- Bean Validation
- JWT
- Google OAuth token verification
- Maven

## Main Functional Areas

- Resource management
- Booking workflow management
- Ticket and incident management
- Notifications
- Authentication and authorization
- Analytics

## API Features

- RESTful endpoint structure
- CRUD operations
- Role-based access control
- Input validation
- Error handling
- MongoDB persistence

## Prerequisites

- Java 21
- Maven
- MongoDB

## Run the Backend

```bash
./mvnw spring-boot:run
```

## Default Server

Runs by default on:  
`http://localhost:8080`

## Project Structure

```text
backend/
├── src/
│   ├── main/
│   └── test/
├── pom.xml
└── README.md
```

## Security

- Google OAuth login integration
- JWT token generation and validation
- Role-based authorization for protected endpoints

## Notes

- MongoDB is used as the primary database.
- The backend serves the React frontend through REST APIs.