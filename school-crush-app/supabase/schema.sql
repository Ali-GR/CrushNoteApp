-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- *** RESET: Drop existing tables to avoid conflicts ***
drop table if exists public.reports cascade;
drop table if exists public.comments cascade;
drop table if exists public.posts cascade;
drop table if exists public.profiles cascade;
drop table if exists public.schools cascade;

-- *** CLEANUP: Remove old triggers/functions ***
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();


-- Schools Table (Re-create)
create table public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles Table (Users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text not null,
  school_id uuid references public.schools(id),
  strikes int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Posts Table
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) not null,
  school_id uuid references public.schools(id) not null,
  content text not null check (char_length(content) <= 500),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Comments Table
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null check (char_length(content) <= 300),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reports Table
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  target_id uuid not null, -- Post ID or Comment ID
  target_type text not null check (target_type in ('post', 'comment')),
  reporter_id uuid references public.profiles(id) not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

-- Policies

-- Schools: anyone can read schools (to join)
create policy "Schools are viewable by everyone" 
on public.schools for select using (true);

-- Schools: authenticated users can create schools (if not found in onboarding)
create policy "Authenticated users can create schools"
on public.schools for insert
with check (auth.role() = 'authenticated');

-- Profiles: users can read profiles from their school
create policy "Profiles viewable by same school"
on public.profiles for select
using (
  auth.uid() in (
    select id from public.profiles where school_id = public.profiles.school_id
  )
);

-- Profiles: users can insert own profile (onboarding)
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

-- Profiles: users can update own profile
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

-- Posts: viewable by same school
create policy "Posts viewable by same school"
on public.posts for select
using (
  school_id in (
    select school_id from public.profiles where id = auth.uid()
  )
);

-- Posts: insertable by authenticated users (into their school)
create policy "Users can create posts in their school"
on public.posts for insert
with check (
  school_id in (
    select school_id from public.profiles where id = auth.uid()
  )
  and
  auth.uid() = user_id
);

-- Comments: viewable by same school (via post)
create policy "Comments viewable by same school"
on public.comments for select
using (
  exists (
    select 1 from public.posts
    where public.posts.id = public.comments.post_id
    and public.posts.school_id in (
      select school_id from public.profiles where id = auth.uid()
    )
  )
);

-- Comments: insertable by authenticated users
create policy "Users can create comments"
on public.comments for insert
with check (auth.uid() = user_id);
