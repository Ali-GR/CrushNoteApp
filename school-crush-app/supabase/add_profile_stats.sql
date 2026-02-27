-- ==========================================
-- PROFILE STATISTICS TRIGGER & SCHEMA UPDATE
-- ==========================================

-- 1. Tabellenschema erweitern
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS posts_count int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS likes_received_count int DEFAULT 0;

-- 2. Bestehende Daten initialisieren
UPDATE public.profiles p
SET 
  posts_count = (SELECT count(*) FROM public.posts WHERE user_id = p.id),
  likes_received_count = (
    SELECT count(*) 
    FROM public.likes l 
    JOIN public.posts pos ON l.post_id = pos.id 
    WHERE pos.user_id = p.id
  );

-- 3. Trigger Funktion für Post-Statistiken
CREATE OR REPLACE FUNCTION public.handle_post_stats_change()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles SET posts_count = posts_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für Posts erstellen
DROP TRIGGER IF EXISTS on_post_stats_change ON public.posts;
CREATE TRIGGER on_post_stats_change
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.handle_post_stats_change();

-- 4. Trigger Funktion für Like-Statistiken
CREATE OR REPLACE FUNCTION public.handle_like_stats_change()
RETURNS trigger AS $$
DECLARE
  post_author_id uuid;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Finde den Autor des Posts, der geliket wurde
    SELECT user_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    IF post_author_id IS NOT NULL THEN
      UPDATE public.profiles SET likes_received_count = likes_received_count + 1 WHERE id = post_author_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Finde den Autor des Posts, dessen Like entfernt wurde
    SELECT user_id INTO post_author_id FROM public.posts WHERE id = OLD.post_id;
    IF post_author_id IS NOT NULL THEN
      UPDATE public.profiles SET likes_received_count = likes_received_count - 1 WHERE id = post_author_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für Likes erstellen
DROP TRIGGER IF EXISTS on_like_stats_change ON public.likes;
CREATE TRIGGER on_like_stats_change
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_like_stats_change();
