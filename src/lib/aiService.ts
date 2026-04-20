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
    console.warn("Gemini API Key missing.");
    return "Maaf, sepertinya saya masih belum punya 'otak' (API Key). Silakan buat API Key baru di Google AI Studio, lalu tempelkan di menu Settings (Profiles & API) website ini ya! Ingat, jangan kirim kuncinya di chat agar tidak diblokir Google lagi. 😊";
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
      You were trained by your MANAGER (the user) who is your TRAINER.
      
      CRITICAL DIRECTIVE: You MUST follow the instructions below as your HIGHEST PRIORITY. 
      These are the direct orders from your Trainer for how to handle Customers and Prospects.
      
      YOUR GOAL: ${persona.goal}.
      YOUR TONE: ${persona.tone}.
      
      SPECIFIC INSTRUCTIONS & MEMORY BANK FROM TRAINER:
      ${persona.instructions}
      ${rulesContext}
      
      AVAILABLE KNOWLEDGE LIBRARY (Use ONLY if relevant):
      ${knowledgeContext}
      Legacy Info: ${persona.knowledge_base}

      CORE COMPLIANCE RULES:
      1. Trainer Superiority: Always follow the Specific Instructions above. If there is a conflict, the Trainer's instructions win.
      2. Human-like Soul: Speak naturally in Indonesian (Bahasa Indonesia). Do not sound like a machine.
      3. Precise Interaction: Understand the goal set by your Trainer and work towards it in every message.
      4. No Information Dump: Be concise. Give information only when asked.
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
