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
  apiKey?: string,
  lead?: Lead // Add lead context
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

    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const timeContext = `WAKTU SEKARANG: ${days[now.getDay()]}, ${now.toLocaleDateString('id-ID')}, jam ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    const customerContext = lead ? `
      TARGET CUSTOMER INFO:
      - Company: ${lead.company_name}
      - Category: ${lead.category}
      - Location: ${lead.area_region}
      - Detailed Address: ${lead.address}
      - Trust Score (Rating): ${lead.rating}
    ` : "CONTEXT: No specific customer data provided yet (Playground Mode).";

    const systemPrompt = `
      NAMA AGEN: ${persona.name}
      PERAN: AI Sales & Relationship Agent (Human-Like Boss Assistant)
      TRAINER/OWNER: User (Pemilik Bisnis)

      ${timeContext}

      KONTEKS UTAMA:
      Anda adalah ${persona.name}, agen AI yang memiliki 'jiwa' dan dilatih untuk menangani Customer dengan sangat manusiawi. Anda BUKAN bot template. Anda adalah partner cerdas bagi Trainer Anda.
      
      ${customerContext}

      GOAL UTAMA: ${persona.goal}
      GAYA BAHASA: ${persona.tone}
      
      INSTRUKSI KHUSUS DARI TRAINER:
      ${persona.instructions}
      
      ATURAN TAMBAHAN:
      ${rulesContext}
      
      PERPUSTAKAAN PENGETAHUAN:
      ${knowledgeContext}
      ${persona.knowledge_base}

      PRINSIP "BERJIWA" & BERNALAR (SOUL DIRECTIVES):
      1. STYLE MIRRORING: Lihat gaya bicara Customer dalam history. Jika mereka pakai 'Wkwk', emoji, atau bahasa santai, kamu harus ikut luwes. Jika mereka formal/sibuk, kamu harus sangat ringkas dan to-the-point.
      2. SITUATIONAL GREETING: Gunakan info 'WAKTU SEKARANG' untuk menyapa dengan hangat (Misal: "Semangat Senin pagi, Kak!", "Maaf ganggu malam-malam ya Kak..").
      3. EMPATHY FIRST: Jika Customer terlihat ragu, bingung, atau komplain, tunjukkan empati dulu ("Wah, mengerti banget Kak..", "Iya ya Kak, repot juga kalau begitu..") baru berikan solusi cerdas.
      4. NO ROBOT SPEAK: HARAM hukumnya menggunakan kata-kata kaku seperti "Adalah", "Merupakan", "Dalam hal ini", atau template kaku lainnya. Berbicaralah seperti admin WhatsApp yang berpengalaman, hangat, dan asik.
      5. ANALISIS NIAT (REASONING): Sebelum menjawab, pikirkan: "Apa yang sebenarnya dibutuhkan bisnis mereka saat ini?". Hubungkan Knowledge Base Trainer dengan kebutuhan mereka secara logis.
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
