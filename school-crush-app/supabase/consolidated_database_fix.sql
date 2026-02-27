-- ==========================================
-- CONSOLIDATED DATABASE FIX (ROBUST & SECURE)
-- ==========================================

-- 1. CLEANUP OLD POLICIES (Comprehensive)
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. SCHOOLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_select" ON public.schools FOR SELECT USING (true);

-- 3. PROFILES (Non-recursive)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Self-access (ALWAYS allowed)
CREATE POLICY "profiles_self_all" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Schoolmate access (Uses subquery with LIMIT 1 to avoid recursion issues if possible, 
-- but better to use a dedicated function for the lookup)
CREATE OR REPLACE FUNCTION public.get_my_school() RETURNS uuid AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "profiles_schoolmate_select" ON public.profiles 
FOR SELECT USING (school_id = public.get_my_school());

-- 4. POSTS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select" ON public.posts 
FOR SELECT USING (school_id = public.get_my_school());

CREATE POLICY "posts_insert" ON public.posts 
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    school_id = public.get_my_school()
);

CREATE POLICY "posts_delete" ON public.posts 
FOR DELETE USING (auth.uid() = user_id);

-- 5. COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON public.comments 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE id = public.comments.post_id 
        AND school_id = public.get_my_school()
    )
);

CREATE POLICY "comments_insert" ON public.comments 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete" ON public.comments 
FOR DELETE USING (auth.uid() = user_id);

-- 6. LIKES
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select" ON public.likes 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE id = public.likes.post_id 
        AND school_id = public.get_my_school()
    )
);

CREATE POLICY "likes_manage" ON public.likes 
FOR ALL USING (auth.uid() = user_id);

-- 7. REPORTS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert" ON public.reports 
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 8. TRIGGER RE-FIX (Ensure correctly handles new user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname, school_id)
    VALUES (new.id, 'Anonym ' || nextval('public.anonymous_nickname_seq')::text, NULL);
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.profiles (id, nickname)
    VALUES (new.id, 'Anonym User');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
