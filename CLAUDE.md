# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend dev server (root)
npm run dev

# Frontend production build → dist/
npm run build

# Server dev (with file watching)
cd server && npm run dev

# Server production
cd server && npm start

# Docker build (builds frontend then packages with server)
docker build -t macromini .
```

No test suite exists. Type-check frontend only:
```bash
npx tsc --noEmit
```

## Architecture

**Split codebase:** TypeScript frontend at root, plain ESM JavaScript backend in `server/`.

### Frontend (`/`)
- Entry: `index.tsx` → `App.tsx` (single-page, no router)
- `types.ts` — all shared TypeScript interfaces
- `constants.ts` — `DEFAULT_PLANS`, `BASE_STORAGE_KEYS`, `TRANSLATIONS`
- `components/` — React components (`.tsx`)
- `services/api.ts` — all backend calls; attaches Firebase JWT via `fetchWithAuth`
- `services/geminiService.ts` — direct Gemini calls from client (shopping list only)
- `lib/firebase.ts` — Firebase client init with env var validation at startup
- `lib/rateLimitStore.ts` — client-side mirror of rate limit state synced from response headers

### Backend (`server/`)
- `index.js` — Express app + all route definitions
- `gemini.js` — Gemini AI functions: `analyzeMeal`, `generateRecipe`, `generateShoppingList`; uses `gemini-2.5-flash`
- `firebase.js` — Firebase Admin SDK init
- `firestoreRateLimit.js` — custom `FirestoreStore` implementing `express-rate-limit` store interface backed by Firestore

### Data flow
1. Frontend authenticates via Firebase Auth (email/password or Google OAuth)
2. Every API call sends `Authorization: Bearer <firebase-id-token>`
3. `verifyToken` middleware validates the token with Firebase Admin SDK
4. `attachUserTier` middleware looks up user tier (FREE=0, PLUS=1, ELITE=2) from Firestore
5. All Firestore user data is Base64-encoded before storage (`encodeData`/`decodeData`)
6. Firestore document IDs are validated against `/^[a-zA-Z0-9_-]+$/` before use

### Rate limiting
- AI endpoints (`/api/ai/*`) use `dynamicRateLimiter` — limits vary by user tier
- Other endpoints use `apiLimiter` (fixed window via `express-rate-limit`)
- The store backing AI rate limits is `FirestoreStore` (persists across restarts)
- Webhook endpoint has its own `webhookLimiter`
- Client syncs remaining quota from response headers into `lib/rateLimitStore.ts`

### Subscriptions
- Payments via Lemon Squeezy; webhook at `POST /api/webhooks/lemonsqueezy`
- Webhook verifies HMAC-SHA256 signature using `req.rawBody`

## Environment Variables

**Frontend (`.env.local`):**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```
All are required — `lib/firebase.ts` throws at startup if any are missing.

**Server (`.env` in `server/`):**
```
GEMINI_API_KEY
# Firebase Admin credentials (service account or Application Default Credentials)
LEMONSQUEEZY_WEBHOOK_SECRET
PORT  # defaults to 8080
```

## Key Conventions

- `tsconfig.json` excludes `server/` — TypeScript only covers frontend
- Server runs on Node 24 (see `server/package.json` `engines`)
- Docker: multi-stage build — stage 1 builds frontend, stage 2 packages server + `dist/`
- The server serves the built frontend via `express.static` only when run directly (not as a Firebase Function)
- `IS_PROD` in `services/api.ts` controls whether API calls go to relative paths or localhost
