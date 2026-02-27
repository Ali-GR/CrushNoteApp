
-- 1. Create Sequence for Anonymous Nicknames
create sequence if not exists public.anonymous_nickname_seq start 1;

-- 2. Create Function for generating nicknames
create or replace function public.generate_anonymous_nickname()
returns text as $$
begin
  return 'Anonym ' || nextval('public.anonymous_nickname_seq')::text;
end;
$$ language plpgsql;

-- 3. Update User Handler (Trigger for new users)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, school_id)
  values (
    new.id,
    public.generate_anonymous_nickname(),
    '00000000-0000-0000-0000-000000000001' -- Default Demo School
  );
  return new;
end;
$$ language plpgsql security definer;

-- 4. RLS RECURSION FIX (Included here for a clean state)
create or replace function public.get_user_school_id(user_uuid uuid)
returns uuid as $$
  select school_id from public.profiles where id = user_uuid;
$$ language sql security definer;

drop policy if exists "Profiles viewable by same school" on public.profiles;
create policy "Profiles viewable by same school" on public.profiles for select using (
  auth.uid() = id 
  OR 
  school_id = public.get_user_school_id(auth.uid())
);

drop policy if exists "Posts viewable by same school" on public.posts;
create policy "Posts viewable by same school" on public.posts for select using (
  school_id = public.get_user_school_id(auth.uid())
);

drop policy if exists "Comments viewable by same school" on public.comments;
create policy "Comments viewable by same school" on public.comments for select using (
  exists (
    select 1 from public.posts
    where public.posts.id = public.comments.post_id
    and public.posts.school_id = public.get_user_school_id(auth.uid())
  )
);

drop policy if exists "Likes viewable by same school" on public.likes;
create policy "Likes viewable by same school" on public.likes for select using (
  exists (
    select 1 from public.posts
    where public.posts.id = public.likes.post_id
    and public.posts.school_id = public.get_user_school_id(auth.uid())
  )
);

-- Reset existing users to Anonym labels (Optional but good for consistency)
-- DO NOT RUN if you want to keep existing nicknames:
-- UPDATE public.profiles SET nickname = 'Anonym ' || (row_number() OVER (ORDER BY created_at));
