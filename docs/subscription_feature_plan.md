# Subscription Feature Implementation Plan

## Overview
This document outlines the steps to implement a tiered subscription system for MacroMini.

**Tiers:**
1.  **Free**: 10 requests per 24 hours. (Default)
2.  **Plus**: 15 requests per 1 hour. (Purchasable via Lemon Squeezy)
3.  **Elite**: 100 requests per 1 hour. (Manual assignment via Firebase Console)

## 1. Database Schema Design (Firestore)

We need to explicitly store user subscription data.

### Collection: `users`
Document ID: `userId` (matches Auth UID)

Fields:
- `tier`: Integer.
    - `0`: Free (Default)
    - `1`: Plus
    - `2`: Elite
- `lemonSqueezyCustomerId`: String (Optional, for Plus users).
- `subscriptionStatus`: Integer.
    - `0`: Inactive / Canceled
    - `1`: Active
    - `2`: Past Due / Payment Failed
    - `3`: Trialing
- `subscriptionId`: String (Lemon Squeezy Subscription ID).

**Note:** For "Elite" users, you will manually set `tier: 2` in the Firebase Console.

## 2. Backend Implementation (Server)

### 2.1. Dependencies
- Install the necessary library (or use fetch/axios):
  ```bash
  cd server
  npm install axios
  ```
  *(We will use the Lemon Squeezy API directly via axios)*

### 2.2. Environment Variables
Add to `.env`:
- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_WEBHOOK_SECRET`
- `LEMONSQUEEZY_VARIANT_ID` (The Variant ID for the Plus plan from Lemon Squeezy Dashboard)
- `LEMONSQUEEZY_STORE_ID` (Your Store ID)
- `CLIENT_URL` (e.g., `http://localhost:5173` or your production URL)
- `GEMINI_API_KEY_FREE`
- `GEMINI_API_KEY_PLUS`
- `GEMINI_API_KEY_ELITE`

### 2.3. Dynamic Rate Limiter
The current rate limiter is static. We need a dynamic one that adjusts based on the user's tier.

**Strategy:**
1.  **Fetch User Tier**: In the `verifyToken` middleware or a new middleware, fetch the user's profile from Firestore to determine their `tier`.
2.  **Apply Logic**:
    -   Create a helper function `getRateLimitConfig(tier)` that returns `{ windowMs, limit }`.
    -   Since `express-rate-limit` is rigid with changing windows per request, we might need to instantiate two separate limiters (one for daily, one for hourly) and choose which one to execute, OR write a custom rate limit wrapper that uses `FirestoreStore` directly.
    -   *Recommended*: A custom middleware using the existing `FirestoreStore` logic but passing the user's specific window and limit.

**Logic Table:**
| Tier | Window | Limit |
| :--- | :--- | :--- |
| `free` | 24 hours | 10 |
| `plus` | 1 hour | 15 |
| `elite` | 1 hour | 100 |

### 2.4. Lemon Squeezy Integration Routes
Create new routes in `server/index.js` (or `server/routes/subscription.js`):

1.  **POST `/api/subscription/create-checkout-session`**:
    -   Requires Auth.
    -   Creates a Checkout via Lemon Squeezy API (`https://api.lemonsqueezy.com/v1/checkouts`).
    -   Passes `custom_data` containing the `userId`.
    -   Returns the `url` for the frontend to redirect to.

2.  **POST `/api/subscription/portal`**:
    -   Requires Auth.
    -   Returns the customer portal URL.
    -   *Note: Lemon Squeezy provides a "Customer Portal" link via their API or you can direct users to their "My Orders" page if authenticated correctly, or use the `update_payment_method` URLs provided in subscription objects.*

3.  **POST `/api/webhooks/lemonsqueezy`**:
    -   **Important**: Verify the `X-Signature` header using the `LEMONSQUEEZY_WEBHOOK_SECRET`.
    -   Events to handle (`meta.event_name`):
        -   `subscription_created`: Update user doc with `lemonSqueezyCustomerId`, `subscriptionId`, set `tier = 1` (Plus) and `subscriptionStatus = 1` (Active).
        -   `subscription_updated`: Update `subscriptionStatus` (e.g., if status changes to `past_due` or `active`).
        -   `subscription_cancelled` or `subscription_expired`: Set `tier = 0` (Free) and `subscriptionStatus = 0` (Canceled).

### 2.5. Tier-Specific Backend API Keys
To prevent "Free" users from consuming the API quota reserved for "Plus" or "Elite" users, we will use distinct API keys for each tier.

**Implementation:**
-   Update `server/gemini.js` to accept an API key as a parameter or context.
-   In the route handlers (`analyzeMeal`, `generateRecipe`, etc.), select the API key based on the user's tier:
    ```javascript
    const apiKeyMap = {
      0: process.env.GEMINI_API_KEY_FREE,
      1: process.env.GEMINI_API_KEY_PLUS,
      2: process.env.GEMINI_API_KEY_ELITE
    };
    const apiKey = apiKeyMap[req.user.tier] || process.env.GEMINI_API_KEY_FREE;
    // Pass apiKey to the Gemini service functions
    ```

## 3. Frontend Implementation

### 3.1. Type Definitions
Update `types.ts`:
```typescript
export type UserTier = 0 | 1 | 2; // 0: Free, 1: Plus, 2: Elite

export interface UserProfile {
  uid: string;
  tier: UserTier;
  subscriptionStatus: number; // 0: Inactive, 1: Active, etc.
  // ... other fields
}
```

### 3.2. Subscription Service
Add methods to `services/api.ts`:
- `createCheckoutSession()`
- `getPortalUrl()` (if applicable)
- `fetchUserProfile()` (to get current tier)

### 3.3. UI Components
1.  **Profile/Settings Page**:
    -   Display current tier.
    -   If `Free`: Show "Upgrade to Plus ($X/mo)" button.
    -   If `Plus`: Show "Manage Subscription" button.
    -   If `Elite`: Show "Elite Member" badge.
2.  **Limit Reached Modal**:
    -   When the API returns 429 (Too Many Requests), show a modal:
        -   "You've hit your daily limit."
        -   CTA: "Upgrade to Plus for 15 requests per hour!"

## 4. Security & Rules
-   Ensure `Elite` tier logic is strictly backend-enforced.
-   Use Firestore Rules to ensure users can only read their own profile and *cannot* write their own `tier` field (tier updates must come from Admin SDK/Webhooks).

## 5. Deployment
-   Set Lemon Squeezy environment variables in Firebase Functions config or Cloud Run env vars.
-   Configure Lemon Squeezy Webhook URL in the Lemon Squeezy Dashboard to point to your deployed function: `https://<region>-<project>.cloudfunctions.net/api/webhooks/lemonsqueezy` (or your custom domain path).
