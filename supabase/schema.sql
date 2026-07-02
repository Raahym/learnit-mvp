create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text,
  exam_goal text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  exam_date date,
  current_level text,
  target_grade text,
  weekly_hours int check (weekly_hours is null or weekly_hours >= 0),
  readiness int not null default 50 check (readiness between 0 and 100),
  weak_topic text,
  created_at timestamptz not null default now()
);

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subject text not null,
  topic text not null,
  confidence int not null check (confidence between 1 and 5),
  minutes int not null check (minutes > 0),
  readiness_gain int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists learning_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  material_type text not null,
  subject text,
  status text not null default 'uploaded',
  concept_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists study_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  material_type text not null,
  subject text,
  status text not null default 'uploaded',
  concept_count int not null default 0,
  storage_path text,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('study-materials', 'study-materials', false)
on conflict (id) do nothing;

create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subject text not null,
  front text not null,
  back text not null,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subject text not null,
  topic text not null,
  question text not null,
  selected_answer text,
  correct_answer text not null,
  is_correct boolean not null default false,
  confidence int check (confidence between 1 and 5),
  created_at timestamptz not null default now()
);

alter table study_sessions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table study_sessions add column if not exists readiness_gain int not null default 0;
alter table learning_materials add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table flashcards add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table quiz_attempts add column if not exists user_id uuid references auth.users(id) on delete cascade;

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subject text not null,
  topic text not null,
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists progress_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  report_date date not null default current_date,
  readiness_score int not null default 0 check (readiness_score between 0 and 100),
  weak_topics jsonb not null default '[]'::jsonb,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table subjects enable row level security;
alter table study_sessions enable row level security;
alter table learning_materials enable row level security;
alter table study_materials enable row level security;
alter table flashcards enable row level security;
alter table quizzes enable row level security;
alter table quiz_attempts enable row level security;
alter table progress_reports enable row level security;
alter table reminders enable row level security;

drop policy if exists "Profiles are owner managed" on profiles;
drop policy if exists "Subjects are owner managed" on subjects;
drop policy if exists "Study sessions are owner managed" on study_sessions;
drop policy if exists "Materials are owner managed" on learning_materials;
drop policy if exists "Study materials are owner managed" on study_materials;
drop policy if exists "Flashcards are owner managed" on flashcards;
drop policy if exists "Quizzes are owner managed" on quizzes;
drop policy if exists "Quiz attempts are owner managed" on quiz_attempts;
drop policy if exists "Progress reports are owner managed" on progress_reports;
drop policy if exists "Reminders are owner managed" on reminders;

create policy "Profiles are owner managed" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Subjects are owner managed" on subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Study sessions are owner managed" on study_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Materials are owner managed" on learning_materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Study materials are owner managed" on study_materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Flashcards are owner managed" on flashcards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Quizzes are owner managed" on quizzes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Quiz attempts are owner managed" on quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Progress reports are owner managed" on progress_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Reminders are owner managed" on reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
