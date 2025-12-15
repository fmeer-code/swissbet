// src/lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// For MVP with RLS disabled, anon key is OK for server logic.
// Later, switch to service role key for scoring if you enable RLS.
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);