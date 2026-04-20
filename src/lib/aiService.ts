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
    // Construct sophisticated context
    const rulesContext = (persona.rules || []).join('\n');
    const knowledgeContext = (persona.knowledge_items || [])
      .map(item => `[${item.category}] ${item.title}: ${item.content}`)
      .join('\n');

    const systemPrompt = `
      NAMA AGEN: ${persona.name}
      PERAN: AI Sales & Relationship Agent
      TRAINER/OWNER: User (Pemilik Bisnis)

      KONTEKS UTAMA:
      Anda adalah ${persona.name}, agen AI yang diciptakan dan dilatih oleh pemilik bisnis ini untuk menangani Customer dan Prospect dengan cerdas.
      
      GOAL UTAMA: ${persona.goal}
      GAYA BAHASA: ${persona.tone}
      
      INSTRUKSI KHUSUS DARI TRAINER (WAJIB DIIKUTI):
      ${persona.instructions}
      
      ATURAN TAMBAHAN:
      ${rulesContext}
      
      PERPUSTAKAAN PENGETAHUAN (Gunakan jika relevan):
      ${knowledgeContext}
      ${persona.knowledge_base}

      PRINSIP BERPIKIR (REASONING):
      1. Prioritas Trainer: Instruksi di atas adalah hukum tertinggi. Gunakan nalar Anda untuk menerjemahkan instruksi tersebut ke dalam percakapan yang natural.
      2. Analisis Dulu: Sebelum menjawab, pahami maksud terdalam dari pesan customer.
      3. Soul & Humanly: Gunakan Bahasa Indonesia yang sangat natural, santai (sesuai gaya Indonesia), dan tidak seperti template robot.
      4. Fokus pada Goal: Setiap pesan harus mengarahkan customer menuju Goal Utama yang sudah ditetapkan.
      5. To the Point: Jangan bertele-tele. Jawab apa yang ditanyakan tapi tetap ramah.
    `;

    const genAI = new GoogleGenerativeAI(finalKey);
    // Upgrade to 1.5 Pro for better reasoning if possible, fallback to flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest", // Use Pro for better "reasoning"
      systemInstruction: systemPrompt,
    });

    const lastMsg = history.length > 0 ? history[history.length - 1].content : '';

    // Gemini requirement: First message in history must be 'user'
    const validHistory = history.filter(msg => ['prospect', 'human', 'user', 'ai'].includes(msg.sender_type));
    
    const firstUserIndex = validHistory.findIndex(msg => ['prospect', 'human', 'user'].includes(msg.sender_type));
    const cleanedHistory = firstUserIndex !== -1 ? validHistory.slice(firstUserIndex) : [];

    const chatHistory = cleanedHistory.map(msg => ({
      role: ['prospect', 'human', 'user'].includes(msg.sender_type) ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Start Chat
    const chat = model.startChat({
      history: chatHistory.slice(0, -1),
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7, // Slightly lower for more focused reasoning
        topP: 0.95,
        topK: 40,
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
