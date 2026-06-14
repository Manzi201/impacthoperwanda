import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please check your .env file.')
}

// Main client — uses anon key, respects RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client — uses service_role key, bypasses RLS
// Used ONLY for admin operations: creating users, confirming emails
// Never expose this client to end users
export const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})
