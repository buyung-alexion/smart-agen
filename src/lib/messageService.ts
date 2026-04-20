import { getSupabase } from './supabase';

export interface ChatMessage {
  id?: string;
  lead_id: string;
  sender_type: 'ai' | 'prospect' | 'human';
  content: string;
  is_draft?: boolean;
  created_at?: string;
}

export const fetchMessages = async (leadId: string): Promise<ChatMessage[]> => {
  const db = getSupabase();
  const { data, error } = await db
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
  const db = getSupabase();
  const { data, error } = await db
    .from('messages')
    .insert([message])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMessageStatus = async (messageId: string, updates: Partial<ChatMessage>) => {
  const db = getSupabase();
  const { data, error } = await db
    .from('messages')
    .update(updates)
    .eq('id', messageId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Real-time subscription helper
export const subscribeToMessages = (leadId: string, onNewMessage: (payload: any) => void) => {
  const db = getSupabase();
  return db
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
