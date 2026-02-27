
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need this to bypass RLS if creating profile for another user, but here we can try with anon first or just check via admin

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixProfile() {
    // 1. Get current user (we need to sign in or use a hardcoded ID if we know it, 
    // but better to just ask user to sign in? No, script can't interact easily.
    // Actually, we can't easily get the 'current' user of the app from this script.
    // BUT we can use the Service Role Key to list users and see who is missing a profile.

    // Attempt to access Service Role Key if user set it in env? 
    // The user was asked to set secrets in Supabase CLI, not necessarily local .env.
    // But let's check if the user has a profile by trying to insert a dummy post with a known user ID?
    // No, we need to fix the DATA.

    console.log("To fix this, we need to ensure the trigger is running for FUTURE users, and fix CURRENT users.");

    // We will output SQL to run in the dashboard.
    const fixSql = `
    -- 1. Restore the Trigger for new users
    create or replace function public.handle_new_user()
    returns trigger as $$
    begin
      insert into public.profiles (id, nickname, school_id)
      values (
        new.id, 
        'New Student', 
        '00000000-0000-0000-0000-000000000001' -- Demo School ID
      );
      return new;
    end;
    $$ language plpgsql security definer;

    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

    -- 2. Backfill missing profiles for existing users
    insert into public.profiles (id, nickname, school_id)
    select id, 'Backfilled Student', '00000000-0000-0000-0000-000000000001'
    from auth.users
    where id not in (select id from public.profiles);
    `;

    console.log("\nCopy this SQL and run it in Supabase SQL Editor to fix the missing profile issue:\n");
    console.log(fixSql);
}

checkAndFixProfile();
