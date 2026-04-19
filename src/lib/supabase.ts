import { createClient } from '@supabase/supabase-js';

// Get these from environment variables later
// Currently defaulting to the standard for the Vercel project ID if not set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ktcmcaghodjobbzalhzh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_key_for_now_replace_with_real_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
