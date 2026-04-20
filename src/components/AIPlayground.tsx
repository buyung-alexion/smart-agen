import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Zap, Save, RefreshCw, Trash2, Brain, History } from 'lucide-react';
import { generateAIDraft } from '../lib/aiService';
import { savePersona, type Persona } from '../lib/personaService';
import type { ChatMessage } from '../lib/messageService';

interface AIPlaygroundProps {
  persona: Persona;
  onPersonaUpdate: (updated: Persona) => void;
}

export const AIPlayground: React.FC<AIPlaygroundProps> = ({ persona, onPersonaUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(
    persona.history?.length > 0 ? persona.history : [
      { lead_id: 'sandbox', sender_type: 'ai', content: `Halo! Saya ${persona.name}. Memori saya siap. Silakan ajak saya ngobrol atau ajarkan gaya baru (misal: "Gunakan gaya formal untuk bos").` }
    ]
  );
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    
    // Get API Key from localStorage (SettingsHub)
    const savedConfig = localStorage.getItem('smart_agent_config');
    let geminiKey = '';
    if (savedConfig) {
      try {
        geminiKey = JSON.parse(savedConfig).geminiKey;
      } catch (e) {
        console.error('Error parsing config for AI Playground:', e);
      }
    }

    const userMsg: ChatMessage = { lead_id: 'sandbox', sender_type: 'human', content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsThinking(true);

    try {
      // Detection: Command/Training vs Chat
      const isInstruction = /tolong|perintah|maka|mulai sekarang|setiap|gunakan|panggil|tawarkan|jangan|gaya|pelajari|menyesuaikan|ingat|bahasaku/i.test(input);

      if (isInstruction) {
        setIsSaving(true);
        const newRules = [...(persona.rules || []), input];
        const updatedPersona = { 
          ...persona, 
          rules: newRules,
          history: updatedMessages
        };
        
        await savePersona(updatedPersona);
        onPersonaUpdate(updatedPersona);
        
        const aiResponse: ChatMessage = { 
          lead_id: 'sandbox', 
          sender_type: 'ai', 
          content: `Baik, saya sudah menyimpan aturan baru di memori saya: "${input}". Saya akan menyesuaikan gaya saya kedepannya.` 
        };
        const finalMessages = [...updatedMessages, aiResponse];
        setMessages(finalMessages);
        
        // Save the AI response to history too
        await savePersona({ ...updatedPersona, history: finalMessages });
        setIsSaving(false);
      } else {
        // Regular real AI response
        const aiDraft = await generateAIDraft(persona, updatedMessages, geminiKey);
        const aiResponse: ChatMessage = { lead_id: 'sandbox', sender_type: 'ai', content: aiDraft };
        const finalMessages = [...updatedMessages, aiResponse];
        setMessages(finalMessages);
        
        // Persistence: Save history to DB
        await savePersona({ ...persona, history: finalMessages });
      }
    } catch (err) {
      console.error('Playground error:', err);
    } finally {
      setIsThinking(false);
    }
  };

  const removeRule = async (index: number) => {
    const newRules = [...(persona.rules || [])];
    newRules.splice(index, 1);
    const updated = { ...persona, rules: newRules };
    await savePersona(updated);
    onPersonaUpdate(updated);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', height: '700px' }}>
      {/* 1. Main Chat Area */}
      <div className="ui-card" style={{ display: 'flex', flexDirection: 'column', background: 'white', padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, white, #f8faff)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--sidebar-gradient)', color: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(112, 40, 250, 0.2)' }}>
               <Bot size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>AI Training Sandbox</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sarah belajar dari setiap obrolan Anda</p>
            </div>
          </div>
          <button 
            onClick={() => setMessages([{ lead_id: 'sandbox', sender_type: 'ai', content: 'Sandbox direset secara visual, tapi saya tetap ingat aturan yang sudah Anda ajarkan.' }])}
            style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #eee', background: 'white', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} /> Clear View
          </button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#fafafa' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.sender_type === 'human' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '12px' }}>
              {msg.sender_type === 'ai' && <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'var(--accent-orange)', display: 'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink: 0 }}><Bot size={18}/></div>}
              <div style={{ 
                maxWidth: '75%',
                padding: '1rem 1.25rem', 
                borderRadius: '18px', 
                background: msg.sender_type === 'human' ? 'var(--sidebar-gradient)' : 'white',
                color: msg.sender_type === 'human' ? 'white' : 'var(--text-main)',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                boxShadow: msg.sender_type === 'ai' ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 12px rgba(112, 40, 250, 0.15)',
                borderBottomLeftRadius: msg.sender_type === 'ai' ? 0 : '18px',
                borderBottomRightRadius: msg.sender_type === 'human' ? 0 : '18px',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isThinking && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <div className="scan-icon-pulse" style={{ width: 8, height: 8, background: 'var(--accent-purple)', borderRadius: '50%' }}></div>
              Sarah sedang memproses memori...
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', background: 'white', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
            <input 
              className="input-styled" 
              placeholder="Ketik simulasi chat atau berikan perintah gaya bahasa..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: '30px', padding: '14px 24px', fontSize: '1rem' }}
            />
            <button 
              type="submit" 
              className="btn-approve" 
              disabled={!input.trim() || isThinking}
              style={{ borderRadius: '50%', width: 50, height: 50, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Send size={22} />
            </button>
            {isSaving && <div style={{ position: 'absolute', top: '-25px', left: '20px', fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 700 }}>Saving learning to database...</div>}
          </form>
        </div>
      </div>

      {/* 2. Memory Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="ui-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: 'var(--accent-purple)' }}>
            <Brain size={20} />
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Memory Bank</h4>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(!persona.rules || persona.rules.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', border: '2px dashed #eee', borderRadius: '12px' }}>
                Belum ada aturan khusus. Sarah akan bekerja secara standar.
              </div>
            ) : (
              persona.rules.map((rule, idx) => (
                <div key={idx} style={{ padding: '10px 12px', background: '#f8f9ff', borderRadius: '10px', border: '1px solid rgba(112,40,250,0.05)', position: 'relative', group: 'true' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', paddingRight: '20px' }}>{rule}</div>
                  <button 
                    onClick={() => removeRule(idx)}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#ff5e89', cursor: 'pointer', opacity: 0.6 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f3f4f6', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
               <Zap size={12} color="var(--accent-orange)" /> Tip Training
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', lineHeight: 1.4 }}>
              Gunakan kata kunci seperti <b>"Gunakan"</b> atau <b>"Mulai sekarang"</b> agar Sarah tahu itu adalah aturan tetap.
            </p>
          </div>
        </div>

        <div className="ui-card" style={{ padding: '1.2rem', display:'flex', alignItems:'center', gap:'10px', background: 'var(--sidebar-gradient)', color: 'white' }}>
           <History size={20} />
           <div style={{ fontSize: '0.85rem' }}>
             <strong>Persistence Active:</strong> Riwayat chat & aturan tersimpan otomatis.
           </div>
        </div>
      </div>
    </div>
  );
};
