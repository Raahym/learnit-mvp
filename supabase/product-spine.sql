-- LearnIt product spine migration.
-- Run this in Supabase SQL after the base schema is live.

alter table public.study_sessions add column if not exists subject_id uuid references public.subjects(id) on delete set null;
alter table public.study_sessions add column if not exists topic_id uuid;
alter table public.quiz_attempts add column if not exists subject_id uuid references public.subjects(id) on delete set null;
alter table public.quiz_attempts add column if not exists topic_id uuid;
alter table public.flashcards add column if not exists subject_id uuid references public.subjects(id) on delete set null;
alter table public.flashcards add column if not exists topic_id uuid;
alter table public.study_materials add column if not exists subject_id uuid references public.subjects(id) on delete set null;

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  name text not null,
  confidence integer default 0 check (confidence between 0 and 5),
  mastery integer default 0 check (mastery between 0 and 100),
  retention integer default 0 check (retention between 0 and 100),
  coverage_status text not null default 'not_started' check (coverage_status in ('not_started', 'learning', 'reviewing', 'exam_ready')),
  last_reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  reason text,
  task_type text not null default 'review' check (task_type in ('setup', 'review', 'quiz', 'flashcards', 'upload', 'assignment')),
  estimated_minutes integer,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  scheduled_for date,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.material_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.study_materials(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  chunk_index integer not null default 0,
  content text not null,
  status text not null default 'ready' check (status in ('processing', 'ready', 'failed')),
  created_at timestamptz default now()
);

create table if not exists public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid references public.flashcards(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  next_review_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.mistake_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  pattern text not null,
  evidence_count integer not null default 1,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  score integer not null check (score between 0 and 100),
  confidence text not null default 'low' check (confidence in ('low', 'medium', 'high')),
  reason text,
  created_at timestamptz default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.topics enable row level security;
alter table public.study_tasks enable row level security;
alter table public.material_chunks enable row level security;
alter table public.flashcard_reviews enable row level security;
alter table public.mistake_patterns enable row level security;
alter table public.readiness_snapshots enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "Users manage own topics" on public.topics;
drop policy if exists "Users manage own study tasks" on public.study_tasks;
drop policy if exists "Users manage own material chunks" on public.material_chunks;
drop policy if exists "Users manage own flashcard reviews" on public.flashcard_reviews;
drop policy if exists "Users manage own mistake patterns" on public.mistake_patterns;
drop policy if exists "Users manage own readiness snapshots" on public.readiness_snapshots;
drop policy if exists "Users read own audit events" on public.audit_events;

create policy "Users manage own topics" on public.topics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own study tasks" on public.study_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own material chunks" on public.material_chunks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own flashcard reviews" on public.flashcard_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own mistake patterns" on public.mistake_patterns for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own readiness snapshots" on public.readiness_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own audit events" on public.audit_events for select using (auth.uid() = user_id);
