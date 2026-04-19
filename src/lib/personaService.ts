import { supabase } from './supabase';

export interface Persona {
  id?: string;
  name: string;
  tone: string;
  goal: string;
  knowledge_base: string;
}

export const fetchActivePersona = async (): Promise<Persona | null> => {
  const { data, error } = await supabase
    .from('ai_personas')
    .select('*')
    .eq('is_active', true)
    .single();
  
  if (error) {
    console.error('Error fetching persona:', error);
    return null;
  }
  return data;
};

export const savePersona = async (persona: Persona) => {
  const { data, error } = await supabase
    .from('ai_personas')
    .upsert({
      id: persona.id || undefined,
      name: persona.name,
      tone: persona.tone,
      goal: persona.goal,
      knowledge_base: persona.knowledge_base,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
