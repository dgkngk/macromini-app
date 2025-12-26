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
