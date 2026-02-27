-- *** RLS FIX (ANTI-RECURSION VERSION) ***

-- 1. Policies für PROFILES aufräumen
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_school_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_manage_all" ON public.profiles;

-- Erlaube jedem, sein eigenes Profil zu sehen
CREATE POLICY "profiles_self_select" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Erlaube, Profile der eigenen Schule zu sehen (Vermeidung von Rekursion)
CREATE POLICY "profiles_school_select" ON public.profiles
FOR SELECT USING (
    school_id IS NOT NULL AND 
    school_id = (SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1)
);

-- Erlaube volle Kontrolle über das eigene Profil
CREATE POLICY "profiles_self_manage_all" ON public.profiles
FOR ALL USING (auth.uid() = id);


-- 2. Policies für POSTS aufräumen
DROP POLICY IF EXISTS "posts_select" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "Posts viewable by same school" ON public.posts;

-- Posts der eigenen Schule sehen
CREATE POLICY "posts_select" ON public.posts
FOR SELECT USING (
    school_id = (SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1)
);

-- Posts in der eigenen Schule erstellen
CREATE POLICY "posts_insert" ON public.posts
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    school_id = (SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1)
);

-- 3. Schools für alle sichtbar
DROP POLICY IF EXISTS "schools_select" ON public.schools;
DROP POLICY IF EXISTS "Schools viewable by everyone" ON public.schools;

CREATE POLICY "schools_select" ON public.schools
FOR SELECT USING (true);
