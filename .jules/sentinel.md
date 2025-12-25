# Sentinel Journal

## 2025-02-17 - Missing HTTP Security Headers **Vulnerability:** The Express server in `server/index.js` lacks standard security headers (e.g., Content Security Policy, X-Frame-Options, X-Content-Type-Options). **Learning:** Even simple API servers need basic protection against common web vulnerabilities like clickjacking and XSS. **Prevention:** Use `helmet` middleware in all Express applications by default.
