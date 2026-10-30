// Supabase project values (Supabase dashboard > Project Settings > API).
// Use the project URL and the PUBLISHABLE key (starts with sb_publishable_) ONLY.
// NEVER put a secret key (sb_secret_...) or the legacy service_role key in this file or anywhere in this repo.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;