## 2024-05-23 - Top-Level Side Effects Hinder Security Verification
**Vulnerability:** Inability to easily verify security fixes in the `server` package locally.
**Learning:** The `server/index.js` file executes top-level code that attempts to access Firebase services (`db.projectId`) immediately upon import. This causes the module to crash in environments without credentials, making unit testing and security verification difficult without a full mock environment.
**Prevention:** Avoid top-level side effects that depend on external services. Wrap initialization logic in functions (e.g., `startServer()`) or check if the service is ready before accessing properties.

## 2025-02-12 - Input Validation and AI Cost Control
**Vulnerability:** Unbounded string inputs in `/api/ai/recipe` and `/api/ai/shopping` could allow attackers to send massive payloads, leading to Denial of Service (DoS) or excessive API costs (Google Gemini).
**Learning:** Reliance on `JSON.stringify` for injection protection is not enough for resource exhaustion. Explicit length limits must be enforced at the API gateway level before processing or sending data to third-party AI services.
**Prevention:** Implement strict length checks (`MAX_PLAN_NAME_LENGTH`, `MAX_INGREDIENT_LENGTH`) on all string inputs, especially those forwarding data to paid APIs.

## 2025-02-12 - Strict CORS via Environment Configuration
**Vulnerability:** The default CORS policy was overly permissive (`*`), allowing any origin to access the API. This poses a risk in production environments where access should be restricted to trusted domains.
**Learning:** Hardcoding origin checks or relying on implicit behavior (like "same-origin") is insufficient. A flexible, environment-driven approach allows for strict security in production while maintaining ease of development.
**Prevention:** Implemented a check for `ALLOWED_ORIGINS` environment variable. If set, it enforces a strict whitelist. If not set, it falls back to permissive behavior (preserving dev workflows), but enables security-conscious deployments to easily lock down the API.
