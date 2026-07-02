create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text,
  exam_goal text,
  created_at timestamptz not null default now()
);

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  topic text not null,
  confidence int not null check (confidence between 1 and 5),
  minutes int not null check (minutes > 0),
  created_at timestamptz not null default now()
);

create table if not exists learning_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  material_type text not null,
  subject text,
  status text not null default 'uploaded',
  concept_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  front text not null,
  back text not null,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  topic text not null,
  question text not null,
  selected_answer text,
  correct_answer text not null,
  is_correct boolean not null default false,
  confidence int check (confidence between 1 and 5),
  created_at timestamptz not null default now()
);
