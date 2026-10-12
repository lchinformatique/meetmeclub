// src/lib/supabase-client.ts
// Supabase browser client — utilisé pour l'auth OAuth Google côté client

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ibfnvkelthganvmisqbn.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZm52a2VsdGhnYW52bWlzcWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTIzODksImV4cCI6MjEwNzMyODM4OX0.bkHTuQe8a761p062dhJhyMMKPYcsrgAATriXEDu-YME";

// Singleton client Supabase pour le navigateur
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
