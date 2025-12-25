# Configuration Guide for Subscription Feature

This guide details how to configure Lemon Squeezy, Firebase, and your local environment to enable the new subscription tiers.

## 1. Lemon Squeezy Configuration

### A. Create the "Plus" Product
1.  Log in to your [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com/).
2.  Go to **Store** -> **Products** -> **New Product**.
3.  **Name**: "MacroMini Plus" (or similar).
4.  **Description**: "15 AI Requests per hour + Priority Support".
5.  **Pricing Model**: Subscription.
6.  **Price**: Set your amount (e.g., $9.99/mo).
7.  **Click Save**.
8.  After saving, find the **Variant ID** for this product. You can find this in the URL when editing the variant, or by using the API. You will need this for `LEMONSQUEEZY_VARIANT_ID`.
9.  Also note your **Store ID** (found in Settings -> Stores or API). Needed for `LEMONSQUEEZY_STORE_ID`.

### B. Get API Keys
1.  Go to **Settings** -> **API**.
2.  Create a new API Key.
3.  Copy the **API Key**. This is your `LEMONSQUEEZY_API_KEY`.

### C. Configure Webhooks
1.  Go to **Settings** -> **Webhooks**.
2.  Click **Create webhook**.
3.  **Endpoint URL**:
    -   **Production**: `https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/api/webhooks/lemonsqueezy`
    -   **Local**: You need to use a tool like `ngrok` to forward events.
        ```bash
        ngrok http 8080
        # Use the HTTPS URL provided by ngrok + /api/webhooks/lemonsqueezy
        ```
4.  **Events to send**: Select the following events:
    -   `subscription_created`
    -   `subscription_updated`
    -   `subscription_cancelled`
    -   `subscription_expired`
5.  Click **Create webhook**.
6.  Copy the **Signing secret**. This is your `LEMONSQUEEZY_WEBHOOK_SECRET`.

## 2. Firebase & Environment Configuration

### A. Environment Variables (`server/.env`)
Create or update `server/.env` with the following:

```env
# Server Configuration
PORT=8080
CLIENT_URL=http://localhost:5173  # Change to your production frontend URL when deploying

# Lemon Squeezy
LEMONSQUEEZY_API_KEY=your_lemon_squeezy_api_key_here
LEMONSQUEEZY_WEBHOOK_SECRET=...
LEMONSQUEEZY_VARIANT_ID=12345
LEMONSQUEEZY_STORE_ID=12345

# Gemini API Keys (Tiered Quotas)
# You can use the same key for all 3 for testing, but different keys are recommended for production limits.
GEMINI_API_KEY_FREE=AIza...
GEMINI_API_KEY_PLUS=AIza...
GEMINI_API_KEY_ELITE=AIza...
```

### B. Deploying Env Vars to Firebase Functions
When deploying to Firebase, you must set these secrets:

```bash
firebase functions:secrets:set LEMONSQUEEZY_API_KEY
firebase functions:secrets:set LEMONSQUEEZY_WEBHOOK_SECRET
# ... repeat for others or use .env loading if configured in firebase.json
```

*Note: The current code uses `dotenv` which loads from `.env` file locally. For Firebase Functions `onRequest`, using `secrets` array in `index.js` is best practice.*

In `server/index.js`, update the `secrets` list if you added new ones:
```javascript
export const api = onRequest({ secrets: ["GEMINI_API_KEY", "LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_WEBHOOK_SECRET", "GEMINI_API_KEY_FREE", "GEMINI_API_KEY_PLUS", "GEMINI_API_KEY_ELITE"] }, app);
```

## 3. "Elite" Tier Setup (Manual)
The "Elite" tier is not purchasable. To grant a user Elite status:

1.  Go to **Firebase Console** -> **Firestore Database**.
2.  Navigate to the `users` collection.
3.  Find the document with the user's `uid`.
4.  Add or Update the field:
    -   **Field**: `tier`
    -   **Type**: `number`
    -   **Value**: `2`
5.  (Optional) Set `subscriptionStatus` to `1` (Active).

## 4. Local Development

1.  Start the server:
    ```bash
    cd server
    npm run dev
    ```
2.  Start the frontend:
    ```bash
    npm run dev
    ```
3.  Start Ngrok (for webhooks):
    ```bash
    ngrok http 8080
    ```
    *Update your local Lemon Squeezy Webhook URL in the dashboard to match the ngrok URL.*

4.  **Testing Upgrade**:
    -   Log in as a user.
    -   Click your avatar -> "Upgrade to Plus".
    -   Use Lemon Squeezy Test Mode (Test card number available in their docs, usually 4242...) to complete payment.
    -   Check Firestore to see `tier` update to `1`.
