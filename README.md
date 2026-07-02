# LearnIt Web App

Deployable Next.js version of the LearnIt AI Academic Operating System concept.

## Run locally

```powershell
pnpm install
pnpm dev
```

## Supabase tables

Run this SQL in Supabase when you are ready to store real data:

```sql
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
```

## Deploy to Vercel

```powershell
pnpm build
pnpm dlx vercel --prod
```

Add the three Supabase environment variables in Vercel project settings.

## Health check

```powershell
curl https://learnit-webapp-ashen.vercel.app/api/health
```

`supabase` returns `missing_env` until the Supabase keys are added to Vercel.
