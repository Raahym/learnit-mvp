# LearnIt Security Checklist

## Implemented Baseline

- Request validation helper in `lib/api-safety.ts`.
- Basic in-memory rate limiting helper.
- Generic user-facing API errors for hardened routes.
- Server-side detailed error logging for hardened routes.
- Upload extension, MIME type, and size checks.
- AI request bounds for `subject`, `topic`, `sourceText`, and `count`.

## High Priority Next

- Move rate limiting to persistent storage.
- Add middleware route protection for `/app`.
- Add password reset and confirmation resend.
- Add audit events for writes.
- Add dependency audit to CI.
- Add secrets scan before deployment.
- Disable production source map exposure if enabled.
- Add file text extraction sandboxing.

## Endpoint Rules

- Public endpoints: strict rate limits.
- Auth endpoints: strict limits with backoff.
- AI endpoints: authenticated and quota-limited.
- Upload endpoints: authenticated, file-type checked, size-limited.
- User write endpoints: schema validated and authenticated.

## Error Handling Rules

- Do not return stack traces.
- Do not return raw database errors to users.
- Do log full errors server-side.
- Do return a useful generic message.
