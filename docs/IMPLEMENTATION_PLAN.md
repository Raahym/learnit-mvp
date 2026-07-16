# LearnIt Implementation Plan

## Phase 1: Product Truth

Status: mostly done.

- Workspace state layer
- `/api/dashboard`
- Truthful dashboard states
- Real sidebar routes
- No fake planner data in production dashboard

## Phase 2: Setup Depth

- Apply Supabase product-spine migration.
- Add topic creation/editing.
- Add subject detail pages.
- Create starter tasks during onboarding.

## Phase 3: Study Loop

- Build diagnostic quiz UI.
- Save quiz attempts by topic.
- Derive mistakes.
- Generate tasks from mistakes.
- Update readiness snapshots.

## Phase 4: Materials

- Add material detail page.
- Add text extraction.
- Store chunks.
- Generate quiz/flashcards from selected chunks.

## Phase 5: AI

- Add real model provider.
- Validate structured JSON.
- Save outputs with provenance.
- Add prompt-injection guardrails around uploaded text.

## Phase 6: Operations

- Add persistent rate limiting.
- Add backup/restore docs.
- Add smoke tests.
- Add error tracking.
- Add deployment checklist.
