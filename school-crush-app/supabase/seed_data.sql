-- *** SEED DATA (FIXED) ***
-- run this to fix the error and get example posts!

-- 1. Remove the constraint that requires a real user login (for Demo Mode)
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- 2. Ensure the Demo School exists
insert into public.schools (id, name, code)
values ('00000000-0000-0000-0000-000000000001', 'Demo School', 'DEMO-1')
on conflict (id) do nothing;

-- 3. Create Dummy Profiles (including your Guest User)
insert into public.profiles (id, nickname, school_id)
values 
  ('11111111-1111-1111-1111-111111111111', 'New Guest', '00000000-0000-0000-0000-000000000001'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ghost', '00000000-0000-0000-0000-000000000001'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'SecretCrush', '00000000-0000-0000-0000-000000000001'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'CampusWatcher', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- 4. Create Example Posts
insert into public.posts (user_id, school_id, content)
values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '00000000-0000-0000-0000-000000000001', 'Hat jemand den neuen Stundenplan gesehen? 😭'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '00000000-0000-0000-0000-000000000001', 'An das Mädchen mit den roten Schuhen heute in der Pause: Du bist hübsch! 🌹'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '00000000-0000-0000-0000-000000000001', 'Wer hat Lust morgen Lerngruppe Mathe? Treffen Bibliothek.'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Endlich funktioniert die App! 🎉')
;
