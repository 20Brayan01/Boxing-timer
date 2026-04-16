# SparTime API Documentation

This document lists all available API endpoints for the SparTime application.

## Base URL
`https://ais-dev-5qjtdymqmpdbjifewfc54h-35951494319.europe-west3.run.app`

---

## Public Endpoints

### Health Check
- **URL:** `/api/health`
- **Method:** `GET`
- **Description:** Returns the status of the server and database connection.

### Get Workouts
- **URL:** `/api/workouts`
- **Method:** `GET`
- **Description:** Retrieves all available workouts, including their instructions and complex structures.

### Get Plans
- **URL:** `/api/plans`
- **Method:** `GET`
- **Description:** Retrieves all available subscription plans.

---

## Authentication Endpoints

### Signup
- **URL:** `/api/auth/signup`
- **Method:** `POST`
- **Body:** `{ "email": "user@example.com", "password": "password123" }`
- **Description:** Registers a new user.

### Login
- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Body:** `{ "email": "user@example.com", "password": "password123" }`
- **Description:** Authenticates a user and returns a session token.

### Get Profile
- **URL:** `/api/auth/me`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Returns the profile of the currently authenticated user.

---

## Payment Endpoints (Stripe)

### Create Checkout Session
- **URL:** `/api/create-checkout-session`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "planName": "Champion", "price": "$6.99", "duration": "3 Months" }`
- **Description:** Initiates a Stripe Checkout session for a subscription plan.

### Verify Subscription
- **URL:** `/api/subscription/verify`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "sessionId": "cs_test_..." }`
- **Description:** Verifies a completed Stripe session and updates the user's subscription status.

---

## Admin Endpoints
*All admin endpoints require a token from a user with the `admin` role.*

### Get Dashboard Stats
- **URL:** `/api/admin/stats`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Returns total users, revenue, recent payments, and growth data.

### List Users
- **URL:** `/api/admin/users`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Returns a list of all registered users.

### Save Workout
- **URL:** `/api/admin/workouts`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `Workout Object`
- **Description:** Creates or updates a workout.

### Delete Workout
- **URL:** `/api/admin/workouts/:id`
- **Method:** `DELETE`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Deletes a specific workout by ID.

### Save Plan
- **URL:** `/api/admin/plans`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `Plan Object`
- **Description:** Creates or updates a subscription plan.

### Download Backup
- **URL:** `/api/admin/backup`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Downloads a copy of the SQLite database file.

---

## Total APIs: 13
