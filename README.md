# Smart Campus Operations Hub

IT3030 – Programming Applications and Frameworks (PAF) Assignment 2026  
Faculty of Computing – SLIIT

A full-stack smart campus management platform developed using **Spring Boot**, **React**, and **MongoDB**.  
The system supports resource management, booking workflows, incident ticketing, role-based access, notifications, and analytics.

---

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Spring Boot
- Spring Security
- Spring Data MongoDB
- JWT Authentication
- Google OAuth Login

### Database
- MongoDB

### CI / Version Control
- GitHub
- GitHub Actions

---

## Project Modules

### Facilities & Assets
- Manage campus resources such as lecture halls, labs, meeting rooms, and equipment
- Resource metadata includes type, capacity, location, and status
- Search and filtering support

### Booking Management
- Users can request bookings for resources
- Booking workflow: `PENDING → APPROVED / REJECTED`
- Conflict checking for overlapping bookings
- Admin review and approval/rejection
- QR-based booking verification/check-in

### Incident Ticketing
- Users can create maintenance and incident tickets
- Ticket workflow: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`
- Technician assignment and resolution notes
- Comments and image attachments

### Notifications
- Notifications for booking updates, ticket status changes, and comments
- Notification panel in the client application
- Notification preferences support

### Authentication & Authorization
- Google OAuth login
- JWT-based authentication
- Role-based access control
- Roles used in the system: `USER`, `ADMIN`, `TECHNICIAN`

---

## Team Contribution

| Member | Module |
|--------|--------|
| Wickramarathna G.W.W.N | Facilities & Assets |
| Hapuarachchi H.N | Booking Management |
| Rajapaksha R.P.H.A | Incident Ticketing |
| Karunarathne U.M.T.N | Auth, Roles & Notifications |

---

## Key Features

- Resource catalogue management
- Booking workflow with conflict prevention
- Incident reporting with attachments
- Technician assignment and ticket tracking
- Notification system
- Google OAuth authentication
- Role-based authorization
- Admin dashboard and analytics
- QR check-in for approved bookings

---

## System Architecture

### Frontend
React client application that consumes the REST API and provides role-based pages for users, admins, and technicians.

### Backend
Spring Boot REST API following layered architecture:
- Controller layer
- Service layer
- Repository layer
- Model layer
- Security layer

### Database
MongoDB is used for persistent storage of:
- users
- resources
- bookings
- tickets
- notifications

---

## How to Run the Project

### Prerequisites
- Java 21
- Node.js 20+
- MongoDB
- Maven
- Git

### Run Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on:  
`http://localhost:8080`

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:  
`http://localhost:5173`

---

## GitHub Actions Workflow

This project uses GitHub Actions for CI.

### Workflow Tasks
- Set up Java 21
- Build and test the Spring Boot backend
- Set up Node.js
- Install frontend dependencies
- Build the React frontend

Workflow file location:  
`.github/workflows/ci.yml`

---

## Sample User Roles

- **USER** – browse resources, request bookings, create tickets
- **ADMIN** – manage resources, review bookings, manage users, monitor tickets
- **TECHNICIAN** – handle assigned tickets and update progress

---

## Repository Structure

```text
it3030-paf-2026-smart-campus-group/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
├── frontend/
└── README.md
```

---

## Notes

- This project was developed for academic purposes as part of the IT3030 module.
- The system is designed to demonstrate RESTful API design, modern frontend development, authentication, role management, and team collaboration.