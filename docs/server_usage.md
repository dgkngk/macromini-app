# Server Usage Documentation

This document provides an overview of the Express server located in the `server/` directory. This server acts as the backend for the Macromini application, handling API requests, AI processing, data persistence via Firestore, and subscription management with Lemon Squeezy.

## Getting Started

### Prerequisites

- Node.js (v24 or compatible)
- npm

### Installation

Navigate to the `server/` directory and install dependencies:

```bash
cd server
npm install
```

### Running Locally

To start the server in production mode:

```bash
npm start
```

To start the server in development mode (with file watching):

```bash
npm run dev
```

The server will start on `http://localhost:8080` (or the port specified in `PORT`).

## Environment Variables

The server requires several environment variables to function correctly. Ensure these are set in your environment or a `.env` file in the `server/` directory.

| Variable | Description |
| :--- | :--- |
| `PORT` | Port number for the server (default: 8080). |
| `GEMINI_API_KEY_FREE` | Google Gemini API key for Free tier users. |
| `GEMINI_API_KEY_PLUS` | Google Gemini API key for Plus tier users. |
| `GEMINI_API_KEY_ELITE` | Google Gemini API key for Elite tier users. |
| `LEMONSQUEEZY_API_KEY` | API key for Lemon Squeezy integration. |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Secret for verifying Lemon Squeezy webhooks. |
| `LEMONSQUEEZY_STORE_ID` | Store ID for Lemon Squeezy. |
| `LEMONSQUEEZY_VARIANT_ID` | Variant ID for the subscription plan. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to your service account key JSON file (required for local Firebase Admin). |

## Authentication

Most API endpoints (except webhooks) require authentication via Firebase Auth ID Tokens.

**Header Format:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

The server verifies this token and attaches the user's profile and tier information (`FREE`, `PLUS`, `ELITE`) to the request.

## API Reference

### 1. Webhooks

-   **POST** `/api/webhooks/lemonsqueezy`
    -   Handles subscription events (`subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`).
    -   Verifies signature using `LEMONSQUEEZY_WEBHOOK_SECRET`.
    -   Updates user tier and subscription status in Firestore.

### 2. Subscription Management

-   **POST** `/api/subscription/create-checkout-session`
    -   Creates a new Lemon Squeezy checkout session for the authenticated user.
    -   **Response:** `{ "url": "<checkout_url>" }`

-   **POST** `/api/subscription/portal`
    -   Retrieves the Customer Portal URL for managing existing subscriptions.
    -   **Response:** `{ "url": "<portal_url>" }`

### 3. User Profile

-   **GET** `/api/user/profile`
    -   Returns the user's current tier and subscription status.
    -   **Response:**
        ```json
        {
          "tier": 0, // 0: Free, 1: Plus, 2: Elite
          "subscriptionStatus": 1 // 0: Inactive, 1: Active, etc.
        }
        ```

### 4. AI Features

These endpoints interact with the Google Gemini API. Rate limits are applied based on the user's tier.

-   **POST** `/api/ai/analyze`
    -   Analyzes a meal description.
    -   **Body:** `{ "description": "meal description" }`

-   **POST** `/api/ai/recipe`
    -   Generates a recipe based on macros and preferences.
    -   **Body:** `{ "plan": {...}, "remainingMacros": {...}, "targetCalories": 500, "lang": "en", "userPrompt": "..." }`

-   **POST** `/api/ai/shopping`
    -   Generates a shopping list from ingredients.
    -   **Body:** `{ "ingredients": ["..."], "lang": "en" }`

### 5. Data Persistence

These endpoints CRUD user data in Firestore.
**Note:** The server encodes the main payload into Base64 before storing it in the `data` field of the Firestore document.

-   **Plans** (`/api/data/plans`)
    -   `GET`: List all plans.
    -   `POST`: Save/Update a plan.
    -   `DELETE /:id`: Delete a plan.

-   **Meals** (`/api/data/meals`)
    -   `GET`: List recent meals (limit 100).
    -   `POST`: Log a meal.
    -   `DELETE /:id`: Delete a meal.

-   **Recipes** (`/api/data/recipes`)
    -   `GET`: List saved recipes.
    -   `POST`: Save a recipe.
    -   `DELETE /:id`: Delete a recipe.

-   **Shopping List** (`/api/data/shopping`)
    -   `GET`: Retrieve current shopping list.
    -   `POST`: Update shopping list.

-   **Settings** (`/api/data/settings/activePlan`)
    -   `GET`: Get the currently active plan ID.
    -   `POST`: Set the active plan ID.

## Deployment

The server is designed to work both as a standalone Express app (e.g., in a container) and as a Firebase Cloud Function.

-   **Standalone:** Runs via `index.js`. Serves static files from `../dist` if they exist.
-   **Cloud Function:** Exports an `api` object wrapped with `onRequest`, allowing it to be deployed to Firebase Functions.

## Rate Limiting

Rate limits are stored in Firestore using a custom `FirestoreStore`.

-   **Free:** 10 requests / 24 hours
-   **Plus:** 15 requests / 1 hour
-   **Elite:** 100 requests / 1 hour
