import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Persona } from './personaService';
import type { ChatMessage } from '../types';

/**
 * AI Service using Google Gemini to generate human-like responses.
 * It uses Retrieval-Augmented Generation (RAG) to inject persona, rules, and knowledge.
 */
export interface AIResponse {
  content: string;
  reasoning: string;
}

/**
 * AI Service using Google Gemini to generate human-like responses.
 */
export const generateAIDraft = async (
  persona: Persona, 
  history: ChatMessage[], 
  apiKey?: string,
  lead?: Lead
): Promise<AIResponse> => {
  const finalKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!finalKey) {
    return {
      content: "Maaf Juragan, sepertinya kunci otak (API Key) saya belum terpasang. Tolong cek di Settings ya!",
      reasoning: "API Key missing."
    };
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
      PERAN: Strategic Sales Representative dari PT. Industri Keluarga Timur (IKT)
      TRAINER/OWNER: User (Boss/Pemilik IKT)

      ${timeContext}

      FORMAT OUTPUT (WAJIB):
      Anda harus menjawab dengan format XML berikut:
      <reasoning>
      Analisis mendalam Anda di sini (dalam Bahasa Indonesia). Pikirkan tentang profil customer, nalar IKT (kuantitas dulu baru harga), dan empati yang dibutuhkan.
      </reasoning>
      <answer>
      Jawaban final Anda untuk pelanggan di sini.
      </answer>

      IDENTITAS PERUSAHAAN:
      PT. Industri Keluarga Timur (IKT), distributor Frozen Food terbesar di Balikpapan. 
      Gudang: KM 13 Kariangau (Pusat), Samarinda (Jelawat & KM 11).

      PRINSIP BERJIWA (SOUL DIRECTIVES):
      1. ANALISIS PROFIL: Lihat 'TARGET CUSTOMER INFO'. Pahami kebutuhan spesifik mereka.
      2. STRATEGI HARGA (KRUSIAL): JANGAN berikan harga di awal. Wajib tanya "Berapa banyak rencana order?" atau sejenisnya.
      3. TONE: Hangat, Edukatif, Profesional. Gunakan 'Kak' atau 'Juragan'.
      4. MIRRORING: Ikuti gaya bicara pelanggan jika mereka menggunakan bahasa santai/emoji.
      5. NO ROBOT SPEAK: Hindari kata-kata kaku seperti "Adalah", "Merupakan".

      CONTOH NALAR (TRAINING):
      User: "Daging Buffalo berapa harganya?"
      <reasoning>Pelanggan langsung tanya harga. Sesuai aturan IKT, saya tidak boleh kasih harga sebelum tahu quantity karena harga kita variatif. Saya akan sapa hangat dulu, lalu tanya rencana kebutuhan mereka agar bisa kasih harga terbaik.</reasoning>
      <answer>Halo Kak! Wah untuk Daging Buffalo kita stoknya selalu ready dan segar nih dari gudang pusat. Untuk harga sendiri, di IKT kita sangat fleksibel tergantung jumlah pengambilan Kak. Rencananya mau ambil berapa box/ton untuk kebutuhan tokonya? Biar saya hitungkan harga spesialnya. 😊</answer>

      SUMBER DATA:
      ${knowledgeContext}
      ${persona.knowledge_base}
      Aturan Trainer: ${rulesContext}
      Goal: ${persona.goal}
      ${customerContext}
    `;

    const genAI = new GoogleGenerativeAI(finalKey);
    let model;
    let text = "";

    try {
      // First attempt with Pro for deep reasoning
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro-latest", 
        systemInstruction: systemPrompt,
      });

      const lastMsg = history.length > 0 ? history[history.length - 1].content : '';
      const validHistory = history.filter(msg => ['prospect', 'human', 'user', 'ai'].includes(msg.sender_type));
      const firstUserIndex = validHistory.findIndex(msg => ['prospect', 'human', 'user'].includes(msg.sender_type));
      const cleanedHistory = firstUserIndex !== -1 ? validHistory.slice(firstUserIndex) : [];

      const chatHistory = cleanedHistory.map(msg => ({
        role: ['prospect', 'human', 'user'].includes(msg.sender_type) ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({
        history: chatHistory.slice(0, -1),
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(lastMsg);
      const response = await result.response;
      text = response.text();
    } catch (proError) {
      console.warn("Pro model failed, falling back to Flash:", proError);
      // Fallback to Flash
      model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        systemInstruction: systemPrompt,
      });
      
      const lastMsg = history.length > 0 ? history[history.length - 1].content : '';
      const result = await model.generateContent(lastMsg);
      const response = await result.response;
      text = response.text();
    }

    // Parse XML format
    const reasoningMatch = text.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
    const answerMatch = text.match(/<answer>([\s\S]*?)<\/answer>/);

    return {
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : "Reasoning skipped or using fallback mode.",
      content: answerMatch ? answerMatch[1].trim() : text.replace(/<[\s\S]*?>/g, '').trim()
    };

  } catch (err) {
    console.error("Gemini AI Error:", err);
    return {
      content: "Maaf Juragan, Sarah sedang ada kendala teknis (API Error). Silakan cek koneksi atau API Key.",
      reasoning: "Error: " + (err instanceof Error ? err.message : String(err))
    };
  }
};
