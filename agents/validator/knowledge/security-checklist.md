# Security Review Checklist

Use this for PLAN_REVIEW and DRIFT_REVIEW. Every item below is a potential FAIL.

## Authentication & Authorization
- [ ] Every protected endpoint has `[Authorize]` attribute (or equivalent middleware)
- [ ] Authorization checks ownership — not just "is logged in" but "does this user own this resource" (IDOR/BOLA prevention)
- [ ] JWT claims are validated: issuer, audience, expiry, signing key
- [ ] Passwords are hashed with BCrypt, Argon2, or PBKDF2 — never MD5/SHA1/plain

## Input Validation
- [ ] All user-controlled inputs validated at controller/API boundary (not inside services)
- [ ] String length limits enforced (prevents buffer overflows and DB column overflow)
- [ ] Numeric ranges validated (no negative prices, no future birthdates where not allowed)
- [ ] File upload types and sizes validated if applicable

## Injection Prevention
- [ ] No raw string concatenation in SQL queries — parameterized queries or ORM only
- [ ] No dynamic LINQ expressions built from user input
- [ ] No `innerHTML` set from user data in frontend (XSS)
- [ ] No `eval()` or dynamic code execution with user input

## Secrets & Configuration
- [ ] No hardcoded API keys, passwords, or connection strings in code
- [ ] No secrets in comments or commit messages
- [ ] Environment-specific config (JWT key, DB string) read from configuration/environment

## Error Handling
- [ ] Error responses do not expose stack traces, file paths, or internal class names
- [ ] 401 vs 403 distinction: 401 = unauthenticated, 403 = authenticated but unauthorized
- [ ] No silent swallows of security exceptions

## CORS
- [ ] CORS origin list is explicit — not `*` in production
- [ ] Allowed methods are restricted to what the API actually uses

## Severity
| Issue | Severity |
|-------|----------|
| Missing [Authorize] on sensitive endpoint | BLOCKING |
| IDOR/ownership check missing | BLOCKING |
| Raw SQL string concatenation | BLOCKING |
| Hardcoded secrets | BLOCKING |
| Stack trace in error response | HIGH |
| CORS wildcard | HIGH |
| Missing input validation | MEDIUM |
