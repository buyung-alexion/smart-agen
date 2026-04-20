import { getSupabase } from './supabase';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: 'Company' | 'Product' | 'Event' | 'Other';
}

export interface Persona {
  id?: string;
  name: string;
  tone: string;
  goal: string;
  instructions: string;
  rules: string[];
  history: any[];
  knowledge_items: KnowledgeItem[];
  knowledge_base: string;
}

export const fetchActivePersona = async (): Promise<Persona | null> => {
  const db = getSupabase();
  const { data, error } = await db
    .from('ai_personas')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error fetching persona:', error);
    return null;
  }

  // Directly mapping columns from the database (Columns must be created via SQL first)
  return {
    ...data,
    instructions: data.instructions || '',
    rules: data.rules || [],
    history: data.history || [],
    knowledge_items: data.knowledge_items || [],
    knowledge_base: data.knowledge_base || ''
  };
};

export const savePersona = async (persona: Persona) => {
  const db = getSupabase();
  
  const { data, error } = await db
    .from('ai_personas')
    .upsert({
      id: persona.id || undefined,
      name: persona.name,
      tone: persona.tone,
      goal: persona.goal,
      instructions: persona.instructions,
      rules: persona.rules || [],
      history: (persona.history || []).slice(-20), // Keep memory lean
      knowledge_items: persona.knowledge_items || [],
      knowledge_base: persona.knowledge_base,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  
  return data as Persona;
};
