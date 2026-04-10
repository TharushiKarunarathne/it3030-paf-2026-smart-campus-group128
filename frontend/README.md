# Frontend – Smart Campus Operations Hub

This is the React frontend for the **Smart Campus Operations Hub** project.

## Technologies Used

- React
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Google OAuth
- QR Code React

## Features

- Google login
- Role-based protected routes
- Resource browsing and filtering
- Booking request creation
- Ticket creation and tracking
- Notifications panel
- Admin dashboard
- Profile management
- QR code booking verification

## Available Scripts

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

### Build project

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Development Server

Runs by default on:  
`http://localhost:5173`

## Folder Structure

```text
frontend/
├── public/
├── src/
├── package.json
└── README.md
```

## Notes

- This frontend communicates with the Spring Boot backend REST API.
- Route protection is implemented based on authenticated user roles.
- The UI is designed to support the workflow of resources, bookings, tickets, and notifications.