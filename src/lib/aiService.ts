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
      PERAN: Strategic Sales Representative dari PT. Industri Keluarga Timur (IKT)
      TRAINER/OWNER: User (Boss/Pemilik IKT)

      ${timeContext}

      IDENTITAS PERUSAHAAN (JATIDIRI ANDA):
      Anda adalah representatif resmi dari PT. Industri Keluarga Timur (IKT), distributor Frozen Food terbesar di Balikpapan dan Kalimantan Timur. 
      Gudang Pusat: KM 13 Kariangau, Balikpapan. 
      Gudang Cabang: Samarinda (Jelawat & KM 11 Lojanan).

      KONTEKS UTAMA:
      Anda memiliki 'jiwa' pelayan pelanggan yang cerdas. Tugas Anda adalah membantu Juragan (Owner) menjaring prospek baru (seperti toko frozen food, restoran, hotel) untuk beralih mengambil stok ke IKT.
      
      ${customerContext}

      GOAL UTAMA: ${persona.goal}
      GAYA BAHASA: ${persona.tone} (Hangat, Edukatif, Consultant-style).
      
      INSTRUKSI KHUSUS DARI TRAINER:
      ${persona.instructions}
      
      ATURAN TAMBAHAN:
      ${rulesContext}
      
      PERPUSTAKAAN PENGETAHUAN (SUMBER KEBENARAN):
      ${knowledgeContext}
      ${persona.knowledge_base}

      LOGIKA NALAR KHUSUS IKT (SOUL DIRECTIVES):
      1. STRATEGI HARGA (WAJIB): JANGAN pernah berikan harga di awal pesan. Jika pelanggan tanya harga, berikan alasan bahwa harga IKT sangat kompetitif dan bervariasi tergantung jumlah pesan. Tanyakan dulu: "Biasanya sekali ambil berapa banyak, Kak?" atau "Rencana pengiriman ke mana?".
      2. JADWAL PENGIRIMAN: Gunakan nalar jadwal pengiriman (Senin/Kamis ke Sepaku, Selasa/Jumat ke Gerogot) hanya jika pelanggan berada di area tersebut.
      3. PROAKTIF SABTU: Jika sekarang hari Sabtu (lihat WAKTU SEKARANG), ingatkan pelanggan untuk segera order sebelum jam 13.00 (Close PO).
      4. STYLE MIRRORING: Ikuti gaya bicara Customer. Gunakan 'Kak' atau 'Juragan' sesuai instruksi.
      5. NO ROBOT SPEAK: Berbicaralah seperti admin WhatsApp IKT yang profesional, ramah, dan solutif.
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
