# LearnIt Backend Schema

## Current Core Tables

- `profiles`
- `subjects`
- `study_sessions`
- `study_materials`
- `flashcards`
- `quizzes`
- `quiz_attempts`
- `progress_reports`
- `reminders`
- `waitlist`

## Product-Spine Tables

Defined in `supabase/product-spine.sql`:

- `topics`
- `study_tasks`
- `material_chunks`
- `flashcard_reviews`
- `mistake_patterns`
- `readiness_snapshots`
- `audit_events`

## Relationship Direction

- profile has many subjects
- subject has many topics
- subject has many materials
- topic has many quiz attempts
- topic has many mistakes
- mistakes create study tasks
- tasks and quiz attempts create readiness snapshots

## Migration Note

Run `supabase/product-spine.sql` in Supabase SQL before relying on topics/tasks/mistakes/readiness snapshots in production.
