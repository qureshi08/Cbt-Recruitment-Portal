-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ROLES TABLE
create table public.roles (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text
);

insert into public.roles (name, description) values
  ('Candidate', 'External user applying for jobs'),
  ('Farooq Sahab', 'Approving Authority'),
  ('HR', 'Recruitment Team'),
  ('Interviewer', 'Interview Panel Member'),
  ('Admin', 'System Administrator');

-- USERS TABLE (Extending Supabase Auth)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role_id uuid references public.roles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CANDIDATES TABLE
create table public.candidates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  phone text,
  position text,
  resume_url text,
  cover_letter text,
  status text not null default 'Applied',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ASSESSMENT SLOTS TABLE
create table public.assessment_slots (
  id uuid primary key default uuid_generate_v4(),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  candidate_id uuid references public.candidates(id),
  is_locked boolean default false,
  hr_id uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INTERVIEWS TABLE
create table public.interviews (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.candidates(id),
  scheduled_at timestamp with time zone not null,
  interviewer_id uuid references public.users(id),
  feedback text,
  decision text, -- 'Recommended', 'Not Recommended'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTIFICATIONS TABLE
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Basic)
alter table public.candidates enable row level security;
alter table public.users enable row level security;

-- Policy: Anyone can insert a candidate (public application)
create policy "Allow public to insert application" on public.candidates
  for insert with check (true);

-- Policy: Candidates can see their own data
-- (Note: Needs custom claim or email match if they don't have auth accounts yet)
-- For now, let's keep it simple for the initial phase.

-- STORAGE BUCKET SETUP
-- 1. Insert bucket for resumes
insert into storage.buckets (id, name, public) 
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

-- 2. Allow public to upload resumes
create policy "Public Upload Resumes" 
on storage.objects for insert 
with check (bucket_id = 'resumes');

-- 3. Allow public to view resumes (needed for the recruitment team to see the links)
create policy "Public View Resumes" 
on storage.objects for select 
using (bucket_id = 'resumes');

-- CANDIDATES READ PERMISSIONS
create policy "Admins can view all candidates" on public.candidates
  for select using (true);

-- INTERVIEWS READ PERMISSIONS
create policy "Admins can view all interviews" on public.interviews
  for select using (true);

-- ASSESSMENT SLOTS READ PERMISSIONS
create policy "Admins can view all slots" on public.assessment_slots
  for select using (true);

-- CANDIDATES UPDATE PERMISSIONS
create policy "Admins can update candidates" on public.candidates
  for update using (true);

-- INTERVIEWS INSERT PERMISSIONS
create policy "Admins can insert interviews" on public.interviews
  for insert with check (true);

-- INTERVIEWS UPDATE PERMISSIONS
create policy "Admins can update interviews" on public.interviews
  for update using (true);

-- NOTIFICATIONS INSERT PERMISSIONS
create policy "Admins can insert notifications" on public.notifications
  for insert with check (true);
