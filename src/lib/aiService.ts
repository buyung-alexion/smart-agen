import type { Persona } from './personaService';
import type { ChatMessage } from '../types';

/**
 * AI Service using a logic-based reasoning engine to generate draft responses.
 * This simulates the Gemini outcome based on Persona guidelines.
 */
export const generateAIDraft = async (
  persona: Persona, 
  history: ChatMessage[], 
  incomingMessage?: string
): Promise<string> => {
  // Simulate network delay for "AI Thinking" feel
  await new Promise(resolve => setTimeout(resolve, 3000));

  const { tone, goal, instructions, knowledge_base } = persona;
  
  // Logic to determine context
  const hasHistory = history.length > 0;
  const lastMsg = incomingMessage || (hasHistory ? history[history.length - 1].content : '');

  // 1. Basic Response Structure based on Tone
  let response = "";
  
  if (tone.includes('Sopan')) {
    response = "Halo, bapak/ibu. ";
  } else if (tone.includes('Santai')) {
    response = "Halo kak, ";
  } else if (tone.includes('Hard Selling')) {
    response = "Peluang besar buat bisnis Anda! ";
  }

  // 2. Incorporate Rules Bank (The "Memory" Logic)
  const allRules = [...(persona.rules || []), persona.instructions];
  let instructionsApplied = false;

  // Adaptive detection: Which rule fits this customer?
  for (const rule of allRules) {
    const lowerRule = rule.toLowerCase();
    
    // Check if customer message matches context for this rule
    const isFormalContext = lastMsg.toLowerCase().match(/selamat siang|halo bapak|mohon info|bisnis/i);
    const isCasualContext = lastMsg.toLowerCase().match(/halo kak|p|halo sis|oi|bro/i);

    if (lowerRule.includes('formal') && isFormalContext) {
      response = "Selamat siang. Mohon maaf mengganggu waktunya. " + response;
      instructionsApplied = true;
    } 
    else if (lowerRule.includes('santai') && isCasualContext) {
      response = "Halo kak! Apa kabar? " + response;
      instructionsApplied = true;
    }

    if (lowerRule.includes('diskon')) {
      response += "Kami ada penawaran diskon khusus lho. ";
      instructionsApplied = true;
    }
    
    if (lowerRule.includes('jawa')) {
      response += "Monggo pinarak, ";
      instructionsApplied = true;
    }
  }

  // 3. Fallback to Goal if no specific instruction matched
  if (!instructionsApplied && goal) {
    response += `Terkait hal tersebut, target kami adalah ${goal.toLowerCase().replace('membujuk', 'membantu')}. `;
  }

  // 4. Knowledge Retrieval (Structured Library)
  if (persona.knowledge_items && persona.knowledge_items.length > 0) {
    const matchedItems = persona.knowledge_items.filter(item => {
      const keywords = lastMsg.toLowerCase().split(' ');
      return keywords.some(word => 
        word.length > 3 && (
          item.title.toLowerCase().includes(word) || 
          item.content.toLowerCase().includes(word)
        )
      );
    });

    if (matchedItems.length > 0) {
      // Prioritize Products then Events
      const bestMatch = matchedItems.find(i => i.category === 'Product') || matchedItems[0];
      response += `\nInformasi Terkait ${bestMatch.title}: ${bestMatch.content}. `;
      instructionsApplied = true;
    }
  }

  // 5. Knowledge Base Context (Legacy Fallback)
  if (!instructionsApplied && knowledge_base) {
    const kbLines = knowledge_base.split('\n');
    const matchedLine = kbLines.find(line => lastMsg.toLowerCase().split(' ').some(word => line.toLowerCase().includes(word)));
    if (matchedLine) {
      response += `Berdasarkan info kami: ${matchedLine.trim()}. `;
    }
  }

  // 5. Final Polish
  if (history.length === 0 && !incomingMessage) {
    response = `Halo! Saya ${persona.name}. ${response} Apakah ada yang bisa kami bantu?`;
  } else {
    response += "Bagaimana menurut Anda?";
  }

  return response;
};
