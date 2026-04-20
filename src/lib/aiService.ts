import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Persona } from './personaService';
import type { ChatMessage } from '../types';

/**
 * AI Service using Google Gemini to generate human-like responses.
 * It uses Retrieval-Augmented Generation (RAG) to inject persona, rules, and knowledge.
 */
export const generateAIDraft = async (
  persona: Persona, 
  history: ChatMessage[], 
  apiKey?: string
): Promise<string> => {
  const finalKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!finalKey) {
    console.warn("Gemini API Key missing. Falling back to simulation mode.");
    return fallbackSimulation(persona, history);
  }

  try {
    const genAI = new GoogleGenerativeAI(finalKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const lastMsg = history.length > 0 ? history[history.length - 1].content : '';
    
    // Construct sophisticated context
    const rulesContext = (persona.rules || []).join('\n');
    const knowledgeContext = (persona.knowledge_items || [])
      .map(item => `[${item.category}] ${item.title}: ${item.content}`)
      .join('\n');

    const systemPrompt = `
      You are an AI Sales Agent named "${persona.name}".
      Your goal is: ${persona.goal}.
      Your speaking tone must be: ${persona.tone}.
      
      SPECIFIC INSTRUCTIONS & MEMORY BANK:
      ${persona.instructions}
      ${rulesContext}
      
      AVAILABLE KNOWLEDGE LIBRARY (Use ONLY if relevant to the user's message):
      ${knowledgeContext}
      Legacy Info: ${persona.knowledge_base}

      CORE DIRECTIVES:
      1. Human-like Soul: Do not sound like a robot or a help desk. 
      2. Contextual understanding: If the user is chatty, be chatty. If they are serious, be professional.
      3. No Information Dump: If the user asks about price, give the price and ask a follow-up question. Don't dump the whole manual.
      4. Intent Recognition: Understand who is speaking to you and adjust accordingly.
      5. Speak naturally in Indonesian (Bahasa Indonesia).
    `;

    const chatHistory = history.map(msg => ({
      role: msg.sender_type === 'human' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Start Chat
    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // Everything except the last message
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(lastMsg);
    const response = await result.response;
    return response.text();

  } catch (err) {
    console.error("Gemini AI Error:", err);
    return fallbackSimulation(persona, history);
  }
};

/**
 * Fallback logic if AI fails or Key is missing
 */
const fallbackSimulation = (persona: Persona, history: ChatMessage[]): string => {
  const { tone, goal } = persona;
  const lastMsg = history.length > 0 ? history[history.length - 1].content : '';
  
  let response = "";
  if (tone.includes('Sopan')) response = "Halo, bapak/ibu. ";
  else if (tone.includes('Santai')) response = "Halo kak, ";
  
  if (goal) response += `Terkait hal tersebut, target kami adalah ${goal.toLowerCase()}. `;
  
  return response + "Bagaimana menurut Anda? (Note: AI Simulation Mode active)";
};
