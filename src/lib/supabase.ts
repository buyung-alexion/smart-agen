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
  
  // Fallback to env or placeholders
  return {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
  };
};

export const getSupabase = () => {
  const config = getSupabaseConfig();
  return createClient(config.url, config.key);
};

// For backward compatibility and immediate use
export const supabase = getSupabase();
