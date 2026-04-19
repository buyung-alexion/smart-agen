import { supabase } from './supabase';

export interface ChatMessage {
  id?: string;
  lead_id: string;
  sender_type: 'ai' | 'prospect' | 'human';
  content: string;
  created_at?: string;
}

export const fetchMessages = async (leadId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data || [];
};

export const sendMessage = async (message: ChatMessage) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([message])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Real-time subscription helper
export const subscribeToMessages = (leadId: string, onNewMessage: (payload: any) => void) => {
  return supabase
    .channel(`messages:lead_id=eq.${leadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lead_id=eq.${leadId}`,
      },
      (payload) => onNewMessage(payload.new)
    )
    .subscribe();
};
