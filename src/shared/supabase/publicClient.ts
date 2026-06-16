import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://api.rbs.rent';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc5NTczOTI0LCJleHAiOjE5MzcyNTM5MjR9.GcY8LEGTsD8q8LSkyVHmWE8heT2dyhNqENktkcWOO7s';

export const publicSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
