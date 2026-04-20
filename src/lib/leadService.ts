import { getSupabase } from './supabase';

export const updateLeadMuteStatus = async (leadId: string, isMuted: boolean, type: 'prospek' | 'customer') => {
  const db = getSupabase();
  const table = type === 'prospek' ? 'prospeks' : 'customers';
  
  const { error } = await db
    .from(table)
    .update({ ai_muted: isMuted })
    .eq('id', leadId);
    
  if (error) throw error;
};
