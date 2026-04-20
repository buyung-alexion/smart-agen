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
  const fallbackGeminiKey = 'AIzaSyB9Qu3_euukAfiWlL4GZiiwYOKBUTp7JNw';
  const finalKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || fallbackGeminiKey;

  if (!finalKey) {
    console.warn("Gemini API Key missing.");
    return "Maaf, sepertinya saya belum dihubungkan ke asisten AI (Gemini Key belum dipasang). Tolong cek menu Settings ya!";
  }

  try {
    const genAI = new GoogleGenerativeAI(finalKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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

    // Gemini requirement: First message in history must be 'user'
    // Map 'prospect', 'human', and 'user' to 'user' role for Gemini, and 'ai' to 'model'
    const validHistory = history.filter(msg => ['prospect', 'human', 'user', 'ai'].includes(msg.sender_type));
    
    // Find the first user message
    const firstUserIndex = validHistory.findIndex(msg => ['prospect', 'human', 'user'].includes(msg.sender_type));
    const cleanedHistory = firstUserIndex !== -1 ? validHistory.slice(firstUserIndex) : [];

    const chatHistory = cleanedHistory.map(msg => ({
      role: ['prospect', 'human', 'user'].includes(msg.sender_type) ? 'user' : 'model',
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
    return "Maaf, sepertinya saya sedang mengalami kendala koneksi ke server pusat. Bisa tolong ulangi pesan Anda?";
  }
};
