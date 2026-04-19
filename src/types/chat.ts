export interface Message {
  id: string;
  sender: 'ai' | 'prospect' | 'human';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  status: 'ai_active' | 'human_takeover';
  messages: Message[];
}
