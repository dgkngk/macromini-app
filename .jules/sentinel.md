## 2024-05-23 - Top-Level Side Effects Hinder Security Verification
**Vulnerability:** Inability to easily verify security fixes in the `server` package locally.
**Learning:** The `server/index.js` file executes top-level code that attempts to access Firebase services (`db.projectId`) immediately upon import. This causes the module to crash in environments without credentials, making unit testing and security verification difficult without a full mock environment.
**Prevention:** Avoid top-level side effects that depend on external services. Wrap initialization logic in functions (e.g., `startServer()`) or check if the service is ready before accessing properties.

## 2025-02-12 - Input Validation and AI Cost Control
**Vulnerability:** Unbounded string inputs in `/api/ai/recipe` and `/api/ai/shopping` could allow attackers to send massive payloads, leading to Denial of Service (DoS) or excessive API costs (Google Gemini).
**Learning:** Reliance on `JSON.stringify` for injection protection is not enough for resource exhaustion. Explicit length limits must be enforced at the API gateway level before processing or sending data to third-party AI services.
**Prevention:** Implement strict length checks (`MAX_PLAN_NAME_LENGTH`, `MAX_INGREDIENT_LENGTH`) on all string inputs, especially those forwarding data to paid APIs.

## 2025-02-27 - Restrictive CORS Policy
**Vulnerability:** The server used a default permissive CORS policy (`app.use(cors())`), allowing any website to make requests to the API. This increases the attack surface for CSRF and data theft if authentication tokens are exposed.
**Learning:** Defaulting to open CORS is convenient for development but dangerous for production. Environment variables should drive security configurations, but fail-safes (like warnings) are needed to prevent breakage when those variables are missing.
**Prevention:** Implement logic to read `ALLOWED_ORIGINS` from environment variables and configure `cors` middleware dynamically. Default to permissive only if explicitly unset, and log a warning.
