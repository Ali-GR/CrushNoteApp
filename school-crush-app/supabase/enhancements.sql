-- *** ENHANCEMENTS: Likes, Triggers, and Moderation ***

-- 1. Create Likes Table
create table if not exists public.likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- 2. Add likes_count to Posts
alter table public.posts add column if not exists likes_count int default 0;

-- 3. Trigger for likes_count
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

-- 4. Rate Limiting: Add tracking columns to profiles
alter table public.profiles 
add column if not exists posts_today_count int default 0,
add column if not exists last_post_date date default current_date;

-- 5. Rate Limiting: Enforcement Function
create or replace function public.enforce_post_limit()
returns trigger as $$
declare
    profile_record record;
begin
    select * into profile_record from public.profiles where id = NEW.user_id;

    -- Reset counter if it's a new day
    if profile_record.last_post_date < current_date then
        update public.profiles 
        set posts_today_count = 1, last_post_date = current_date
        where id = NEW.user_id;
        return NEW;
    end if;

    -- Check if limit reached
    if profile_record.posts_today_count >= 3 then
        raise exception 'Tägliches Limit erreicht (3/3)';
    end if;

    -- Increment counter
    update public.profiles 
    set posts_today_count = profile_record.posts_today_count + 1
    where id = NEW.user_id;
    
    return NEW;
end;
$$ language plpgsql security definer;

create trigger on_post_insert_limit
before insert on public.posts
for each row execute function public.enforce_post_limit();

-- 6. Refine RLS for Banned Users
-- We'll add a helper function to check if a user is banned
create or replace function public.is_banned(user_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles 
    where id = user_uuid and strikes >= 3
  );
end;
$$ language plpgsql security interpreter;

-- Update existing policies to exclude banned users
-- (This should be applied to all INSERT/UPDATE/DELETE policies)

-- 7. Realtime Enablement
begin;
  -- Remove existing if any
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.posts, public.comments, public.likes;

-- 8. Increment Strikes RPC
create or replace function public.increment_strikes(user_uuid uuid)
returns void as $$
begin
  update public.profiles
  set strikes = strikes + 1
  where id = user_uuid;
end;
$$ language plpgsql security definer;
