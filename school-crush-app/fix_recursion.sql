
-- 1. Create a security definer function to safely get the user's school
-- This function bypasses RLS, avoiding infinite recursion.
create or replace function public.get_user_school_id(user_uuid uuid)
returns uuid as $$
  select school_id from public.profiles where id = user_uuid;
$$ language sql security definer;

-- 2. Drop the problematic recursive policy
drop policy if exists "Profiles viewable by same school" on public.profiles;

-- 3. Create a clean, non-recursive policy
-- Users can see their own profile OR profiles belonging to their school
create policy "Profiles viewable by same school" on public.profiles for select using (
  auth.uid() = id 
  OR 
  school_id = public.get_user_school_id(auth.uid())
);

-- 4. Update the Posts policy as well for consistency and performance
drop policy if exists "Posts viewable by same school" on public.posts;
create policy "Posts viewable by same school" on public.posts for select using (
  school_id = public.get_user_school_id(auth.uid())
);

-- 5. Update Comments and Likes policies too
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

-- Done! This should stop the recursion errors.
