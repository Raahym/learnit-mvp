# LearnIt Operator Guide

## Key Paths

- App folder: `C:\Users\DELL\Documents\Personal folders\My shit\biz\saas\learnit\learnit-webapp`
- Supabase schema: `supabase/schema.sql`
- Product migration: `supabase/product-spine.sql`
- Product audit: `C:\Users\DELL\Documents\Codex\2026-07-03\continue-the-learnit-saas-mvp-from\outputs\learnit_product_rescue_audit_and_plan.md`

## Before Deploying

1. Run `pnpm build`.
2. Check changed API routes for validation and generic errors.
3. Confirm no secrets were added to code.
4. Confirm Supabase migrations are applied if code depends on them.
5. Smoke test login, signup, `/app`, upload, and dashboard.

## Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Future AI:

- `OPENAI_API_KEY` or chosen provider key

## Smoke Tests

- Landing page loads.
- Signup page loads.
- Login page loads.
- Logged-out `/app` goes to login.
- Onboarding-required user sees onboarding.
- New user does not see fake Physics data.
- Dashboard loads from `/api/dashboard`.
- Upload rejects unsupported files.
- AI route rejects invalid oversized input.
