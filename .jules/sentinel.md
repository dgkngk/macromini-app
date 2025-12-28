# Sentinel Journal

## 2025-02-17 - Missing HTTP Security Headers
**Vulnerability:** The Express server in `server/index.js` lacks standard security headers (e.g., Content Security Policy, X-Frame-Options, X-Content-Type-Options).
**Learning:** Even simple API servers need basic protection against common web vulnerabilities like clickjacking and XSS.
**Prevention:** Use `helmet` middleware in all Express applications by default.

## 2025-02-17 - Prompt Injection Mitigation
**Vulnerability:** User input (`userPrompt`) was directly interpolated into the AI system prompt in `server/gemini.js`, allowing users to potentially override system instructions (Prompt Injection).
**Learning:** LLMs will follow the most recent or "strongest" instruction. Interpolating user input directly into the prompt without boundaries or safety instructions is dangerous.
**Prevention:**
1. Sanitize input: Remove characters that break structure (like newlines or quotes) and limit length.
2. Structure the prompt: Wrap user input in a clear "User Preference" section.
3. Explicit Instructions: Add system instructions to explicitly IGNORE the user input if it conflicts with core goals or safety rules.
=======
**Vulnerability:** The Express server in `server/index.js` lacks standard security headers.
**Learning:** Even simple API servers need basic protection against common web vulnerabilities like clickjacking and XSS.
**Prevention:** Use `helmet` middleware in all Express applications by default.

## 2025-02-17 - Hardcoded Secrets in Client Code
**Vulnerability:** API keys and Firebase config were hardcoded in `lib/firebase.ts`.
**Learning:** Client-side code is public. Hardcoding secrets exposes them to anyone who views the source.
**Prevention:** Always use environment variables (`import.meta.env`) and never commit `.env` files.

## 2025-02-17 - Information Leakage in Server Errors
**Vulnerability:** Server endpoints were returning `e.message` directly to the client.
**Learning:** Error messages can reveal internal database structure or logic flaws.
**Prevention:** Log the error server-side and return a generic "Internal Server Error" message to the client.

## 2025-02-17 - Sensitive Data Logging
**Vulnerability:** Full user objects (plans, recipes) were being logged to the console.
**Learning:** Logs are often stored insecurely or accessible to too many people. PII or sensitive data in logs is a leak.
**Prevention:** Log only IDs or metadata, never full data payloads unless strictly necessary for debugging in a secure environment.

## 2025-02-17 - Missing Rate Limiting on Data Routes
**Vulnerability:** Data persistence endpoints (`/api/data/*`) were not rate-limited.
**Learning:** Even authenticated endpoints can be abused to scrape data or cause denial of service.
**Prevention:** Apply rate limiting middleware to all API routes, not just expensive AI ones.

