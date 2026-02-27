-- ===========================================
-- AUTO-MODERATION SYSTEM
-- Führe dieses SQL im Supabase SQL Editor aus!
-- ===========================================

-- 1. Fix: Reports RLS deaktivieren (damit Melden funktioniert)
alter table public.reports disable row level security;

-- 2. Auto-Moderation Funktion
-- Wenn ein Post 3+ Meldungen hat:
--   → Post wird gelöscht
--   → Autor bekommt einen Strike
--   → Bei 3 Strikes = Account gebannt
create or replace function public.moderate_reported_post(post_uuid uuid)
returns json as $$
declare
    report_count int;
    post_author uuid;
    author_strikes int;
begin
    -- Zähle Reports für diesen Post
    select count(*) into report_count 
    from public.reports 
    where target_id = post_uuid and target_type = 'post';
    
    -- Bei 3+ Reports: Auto-Moderation
    if report_count >= 3 then
        -- Finde Post-Autor
        select user_id into post_author 
        from public.posts 
        where id = post_uuid;
        
        if post_author is not null then
            -- Strike vergeben
            update public.profiles 
            set strikes = strikes + 1 
            where id = post_author;
            
            -- Aktuelle Strikes abfragen
            select strikes into author_strikes 
            from public.profiles 
            where id = post_author;
            
            -- Post löschen
            delete from public.posts where id = post_uuid;
            
            return json_build_object(
                'action', 'deleted',
                'reason', 'Zu viele Meldungen (3+)',
                'strikes', author_strikes,
                'banned', author_strikes >= 3
            );
        end if;
    end if;
    
    -- Noch nicht genug Reports
    return json_build_object(
        'action', 'noted',
        'report_count', report_count,
        'threshold', 3
    );
end;
$$ language plpgsql security definer;
