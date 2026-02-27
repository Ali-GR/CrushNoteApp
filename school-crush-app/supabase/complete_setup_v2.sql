-- *** COMPLETE SETUP v2 - OHNE TEST-BEITRÄGE! ***

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Clean Slate (RESET ALL DATA)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.reports cascade;
drop table if exists public.comments cascade;
drop table if exists public.likes cascade;
drop table if exists public.posts cascade;
drop table if exists public.profiles cascade;
drop table if exists public.schools cascade;

-- 3. Base Schema (Tables)
create table public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.profiles (
  id uuid primary key,
  nickname text not null,
  school_id uuid references public.schools(id),
  strikes int default 0,
  posts_today_count int default 0,
  last_post_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) not null,
  school_id uuid references public.schools(id) not null,
  content text not null check (char_length(content) <= 500),
  likes_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null check (char_length(content) <= 300),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  target_id uuid not null,
  target_type text not null check (target_type in ('post', 'comment')),
  reporter_id uuid references public.profiles(id) not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- 4. RLS Policies (Security)
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.likes enable row level security;

-- Helper Function: Is Banned?
create or replace function public.is_banned(user_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles 
    where id = user_uuid and strikes >= 3
  );
end;
$$ language plpgsql security definer;

-- Schools: Viewable by everyone
create policy "Schools viewable by everyone" on public.schools for select using (true);

-- Profiles: Viewable by same school
create policy "Profiles viewable by same school" on public.profiles for select using (
  auth.uid() in (select id from public.profiles where school_id = public.profiles.school_id)
);

-- Profiles: Users can manage own profile
create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id);

-- Posts: Viewable by same school
create policy "Posts viewable by same school" on public.posts for select using (
  school_id in (select school_id from public.profiles where id = auth.uid())
);

-- Posts: Insertable by authenticated users (and not banned)
create policy "Users create posts" on public.posts for insert with check (
  auth.uid() = user_id 
  and not public.is_banned(auth.uid())
);

-- Comments: Viewable by same school
create policy "Comments viewable by same school" on public.comments for select using (
  exists (
    select 1 from public.posts
    where public.posts.id = public.comments.post_id
    and public.posts.school_id in (select school_id from public.profiles where id = auth.uid())
  )
);

-- Comments: Insertable by users (and not banned)
create policy "Users create comments" on public.comments for insert with check (
  auth.uid() = user_id
  and not public.is_banned(auth.uid())
);

-- Likes: Viewable by same school
create policy "Likes viewable by same school" on public.likes for select using (
  exists (
    select 1 from public.posts
    where public.posts.id = public.likes.post_id
    and public.posts.school_id in (select school_id from public.profiles where id = auth.uid())
  )
);

-- Likes: Insertable/Deletable by users (and not banned)
create policy "Users manage likes" on public.likes for all using (
  auth.uid() = user_id
  and not public.is_banned(auth.uid())
);


-- 5. Triggers & Functions (Logic)

-- Trigger: Update likes_count
create or replace function public.handle_like_change()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts set likes_count = likes_count + 1 where id = NEW.post_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.posts set likes_count = likes_count - 1 where id = OLD.post_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_like_change
after insert or delete on public.likes
for each row execute function public.handle_like_change();

-- Trigger: Rate Limiting (3 posts/day)
create or replace function public.enforce_post_limit()
returns trigger as $$
declare
    profile_record record;
begin
    select * into profile_record from public.profiles where id = NEW.user_id;
    
    -- Reset counter if new day
    if profile_record.last_post_date < current_date then
        update public.profiles 
        set posts_today_count = 1, last_post_date = current_date
        where id = NEW.user_id;
        return NEW;
    end if;

    -- Check limit
    if profile_record.posts_today_count >= 3 then
        raise exception 'Tägliches Limit erreicht (3/3)';
    end if;

    -- Increment
    update public.profiles 
    set posts_today_count = profile_record.posts_today_count + 1
    where id = NEW.user_id;
    
    return NEW;
end;
$$ language plpgsql security definer;

create trigger on_post_insert_limit
before insert on public.posts
for each row execute function public.enforce_post_limit();

-- RPC: Increment Strikes (used by AI Edge Function)
create or replace function public.increment_strikes(user_uuid uuid)
returns void as $$
begin
  update public.profiles
  set strikes = strikes + 1
  where id = user_uuid;
end;
$$ language plpgsql security definer;

-- 6. Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.posts, public.comments, public.likes;


-- *** SEED DATA - NUR SCHULEN, KEINE BEITRÄGE! ***

-- 1. Schulen einfügen
INSERT INTO public.schools (name) VALUES
('Gymnasium München'),
('Gymnasium Nord'),
('Gymnasium West'),
('Realschule Berlin'),
('Realschule Mitte'),
('Gesamtschule Hamburg'),
('Berufskolleg Dortmund'),
('Waldorfschule Dresden');

-- Prüfen ob die Schulen eingefügt wurden
SELECT * FROM public.schools;

-- 2. Auth Trigger für neue User (automatisch Anonym + erste Schule)
create sequence if not exists public.anonymous_nickname_seq start 1;

create or replace function public.generate_anonymous_nickname()
returns text as $$
begin
  return 'Anonym ' || nextval('public.anonymous_nickname_seq')::text;
end;
$$ language plpgsql;

create or replace function public.handle_new_user()
returns trigger as $$
declare
    erste_schule_id uuid;
begin
    SELECT id INTO erste_schule_id FROM public.schools LIMIT 1;
    
    insert into public.profiles (id, nickname, school_id)
    values (
        new.id,
        public.generate_anonymous_nickname(),
        erste_schule_id
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();