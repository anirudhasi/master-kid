import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabase } from './env'

// Single shared client. `null` until a real project is configured — every
// caller must handle the null case (the mock providers do, by design).
export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null
