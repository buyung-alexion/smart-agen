import { supabase } from './supabase';

export interface Campaign {
  id?: string;
  filter_category: string;
  opening_message: string;
  target_count: number;
  status: string;
}

export const fetchCampaigns = async (): Promise<Campaign[]> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
  return data || [];
};

export const createCampaign = async (campaign: Campaign) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([campaign])
    .select()
    .single();

  if (error) throw error;
  return data;
};
