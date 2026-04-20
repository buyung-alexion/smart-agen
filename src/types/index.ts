export interface Lead {
  id: string;
  created_at: string;
  category: string;
  company_name: string;
  address: string;
  area_region: string;
  phone_number: string;
  map_location: string;
  rating: number;
  status: string;
  ai_muted?: boolean;
}

export interface ChatMessage {
  id?: string;
  lead_id: string;
  sender_type: 'ai' | 'prospect' | 'human';
  content: string;
  is_draft?: boolean;
  created_at?: string;
}
