## 2024-05-23 - Top-Level Side Effects Hinder Security Verification
**Vulnerability:** Inability to easily verify security fixes in the `server` package locally.
**Learning:** The `server/index.js` file executes top-level code that attempts to access Firebase services (`db.projectId`) immediately upon import. This causes the module to crash in environments without credentials, making unit testing and security verification difficult without a full mock environment.
**Prevention:** Avoid top-level side effects that depend on external services. Wrap initialization logic in functions (e.g., `startServer()`) or check if the service is ready before accessing properties.

## 2025-02-12 - Input Validation and AI Cost Control
**Vulnerability:** Unbounded string inputs in `/api/ai/recipe` and `/api/ai/shopping` could allow attackers to send massive payloads, leading to Denial of Service (DoS) or excessive API costs (Google Gemini).
**Learning:** Reliance on `JSON.stringify` for injection protection is not enough for resource exhaustion. Explicit length limits must be enforced at the API gateway level before processing or sending data to third-party AI services.
**Prevention:** Implement strict length checks (`MAX_PLAN_NAME_LENGTH`, `MAX_INGREDIENT_LENGTH`) on all string inputs, especially those forwarding data to paid APIs.

## 2024-01-08 - [Restrictive CORS Policy]
**Vulnerability:** The Express backend was using a default CORS configuration (`app.use(cors())`), effectively allowing requests from any origin (`Access-Control-Allow-Origin: *`). While acceptable for development, this exposes the API to Cross-Site Request Forgery (CSRF) or unauthorized consumption by malicious sites in production.
**Learning:** Default middleware configurations often favor developer convenience over security. Always explicitly define boundaries for production environments.
**Prevention:** I implemented logic to read an `ALLOWED_ORIGINS` environment variable. If present, the application strictly validates the `Origin` header against this list. If absent, it falls back to the permissive default (to avoid breaking existing setups) but this is now configurable without code changes.
