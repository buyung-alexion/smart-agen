import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const saved = localStorage.getItem('smart_agent_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.supabaseUrl && parsed.supabaseKey) {
        return {
          url: parsed.supabaseUrl,
          key: parsed.supabaseKey
        };
      }
    } catch (e) {
      console.error('Error parsing supabase config:', e);
    }
  }
  
  // Fallback to env or hardcoded keys for instant activation
  const fallbackUrl = 'https://ktcmcaghodjobbzalhzh.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Y21jYWdob2Rqb2JiemFsaHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTQ0NTEsImV4cCI6MjA5MTU3MDQ1MX0.ng9RJG90TkMRsCZzt0SKEtcYV-r3fmpjPZPXZQFQnlQ';

  return {
    url: import.meta.env.VITE_SUPABASE_URL || fallbackUrl,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackKey
  };
};

export const getSupabase = () => {
  const config = getSupabaseConfig();
  return createClient(config.url, config.key);
};

// For backward compatibility and immediate use
export const supabase = getSupabase();
