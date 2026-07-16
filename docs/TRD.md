# LearnIt TRD

## Stack

- Next.js App Router
- React
- TypeScript
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Vercel deployment

## Source Of Truth

The app dashboard must load from `/api/dashboard`, not from separate client-side guesses.

`/api/dashboard` returns:

- profile
- workspaceState
- primaryAction
- subjects
- topics
- tasks
- materials
- sessions
- quizAttempts
- weakTopics
- readinessSummary
- quizSummary
- setupChecklist

## Security Baseline

- Validate request bodies with schemas.
- Rate limit public, AI, upload, and write endpoints.
- Return generic user-facing errors.
- Log detailed errors server-side.
- Store secrets only in environment variables.
- Validate upload extension, MIME type, and size.

## Future Technical Work

- Add middleware for `/app` protection.
- Add persistent rate limiting backed by Redis or Supabase.
- Add material text extraction worker.
- Add AI structured-output validation and provenance.
- Add audit events for important actions.
- Add automated smoke tests.
