import React, { useState, useEffect } from 'react';
import { Bot, Zap, MessageCircle, Settings2, Play, User, Edit3, Send, CheckCircle2 } from 'lucide-react';
import type { Lead } from '../types';
import { fetchActivePersona, savePersona, type Persona } from '../lib/personaService';
import { fetchMessages, sendMessage, subscribeToMessages, type ChatMessage } from '../lib/messageService';

import { fetchCampaigns, createCampaign, type Campaign } from '../lib/campaignService';

interface SmartActionHubProps {
  prospects: Lead[];
  activeSubTab: 'persona' | 'campaign' | 'inbox';
  setActiveSubTab: (tab: 'persona' | 'campaign' | 'inbox') => void;
}

export const SmartActionHub: React.FC<SmartActionHubProps> = ({ prospects, activeSubTab, setActiveSubTab }) => {
  const [persona, setPersona] = useState<Persona>({
    name: 'Sarah - Sales Representative',
    tone: 'Sopan & Profesional',
    goal: '',
    knowledge_base: ''
  });
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Campaign State
  const [campaignCategory, setCampaignCategory] = useState('All');
  const [openingMsg, setOpeningMsg] = useState('Halo {{company_name}}! Kami punya penawaran menarik...');
  const [isLaunching, setIsLaunching] = useState(false);

  // 1. Initial Load
  useEffect(() => {
    const init = async () => {
      const pData = await fetchActivePersona();
      if (pData) setPersona(pData);
    };
    init();
  }, []);
  
  const handleLaunchCampaign = async () => {
    setIsLaunching(true);
    try {
      const targetCount = campaignCategory === 'All' 
        ? prospects.length 
        : prospects.filter(p => p.category === campaignCategory).length;

      await createCampaign({
        filter_category: campaignCategory,
        opening_message: openingMsg,
        target_count: targetCount,
        status: 'Running'
      });
      alert('Campaign launched successfully and recorded to database!');
    } catch (err) {
      console.error(err);
      alert('Failed to launch campaign.');
    } finally {
      setIsLaunching(false);
    }
  };

  // 2. Load Messages when Active Chat changes
  useEffect(() => {
    if (activeChatId) {
      const loadMessages = async () => {
        const data = await fetchMessages(activeChatId);
        setMessages(data);
      };
      loadMessages();

      // Subscribe to Realtime updates
      const subscription = subscribeToMessages(activeChatId, (newMsg) => {
        setMessages(prev => [...prev, newMsg]);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeChatId]);

  const handleSavePersona = async () => {
    setIsSaving(true);
    try {
      await savePersona(persona);
      alert('Persona saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save persona.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatId) return;
    
    try {
      await sendMessage({
        lead_id: activeChatId,
        sender_type: 'human',
        content: newMessage
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ width: '100%' }}>

      {/* 1. Persona Builder */}
      {activeSubTab === 'persona' && (
        <div className="ui-card" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
            <div style={{ padding: '10px', background: 'rgba(255,163,0,0.1)', borderRadius: '12px', color: 'var(--accent-orange)' }}>
               <Settings2 size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Train Your AI Agent</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Konfigurasi bagaimana agen AI (Gemini) berinteraksi dengan prospek.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="search-box" style={{ padding: '0' }}>
                <label>Nama AI Agent</label>
                <input 
                  type="text" 
                  className="input-styled" 
                  value={persona.name} 
                  onChange={(e) => setPersona({...persona, name: e.target.value})}
                  style={{ border: '1px solid rgba(0,0,0,0.05)' }} 
                />
              </div>
              
              <div className="search-box" style={{ padding: '0' }}>
                <label>Gaya Bahasa (Tone & Voice)</label>
                <select 
                  className="input-styled" 
                  value={persona.tone}
                  onChange={(e) => setPersona({...persona, tone: e.target.value})}
                  style={{ border: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <option>Sopan & Profesional</option>
                  <option>Santai & Asik (Panggilan Kak)</option>
                  <option>Persuasif & Hard Selling</option>
                  <option>Edukasi & Konsultan</option>
                </select>
              </div>

              <div className="search-box" style={{ padding: '0' }}>
                <label>Tujuan / Goal Interaksi</label>
                <textarea 
                  className="input-styled" 
                  rows={4} 
                  style={{ border: '1px solid rgba(0,0,0,0.05)', resize: 'none' }}
                  value={persona.goal}
                  onChange={(e) => setPersona({...persona, goal: e.target.value})}
                  placeholder="Membujuk restoran untuk mencoba aplikasi kasir kita..."
                ></textarea>
              </div>
            </div>

            <div className="search-box" style={{ padding: '0', height: '100%' }}>
              <label>Knowledge Base (FAQ / Info Produk)</label>
              <textarea 
                className="input-styled" 
                style={{ border: '1px solid rgba(0,0,0,0.05)', resize: 'none', height: 'calc(100% - 30px)' }}
                value={persona.knowledge_base}
                onChange={(e) => setPersona({...persona, knowledge_base: e.target.value})}
                placeholder="Harga: Rp 50.000/Bulan..."
              ></textarea>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn-approve" 
              style={{ padding: '0.8rem 2rem' }}
              onClick={handleSavePersona}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Simpan AI Persona'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Campaign Manager */}
      {activeSubTab === 'campaign' && (
        <div className="ui-card" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Launch Follow-Up Campaign</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Targetkan database prospek untuk disapa secara otonom oleh AI.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="search-box" style={{ padding: '1.5rem', background: 'var(--bg-app)' }}>
               <h4 style={{ marginBottom: '1rem' }}>Pilih Database Prospek</h4>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <select 
                   className="input-styled" 
                   value={campaignCategory}
                   onChange={(e) => setCampaignCategory(e.target.value)}
                   style={{ border: '1px solid rgba(0,0,0,0.05)', flex: 1 }}
                 >
                   <option value="All">Semua Kategori Prospek ({prospects.length})</option>
                   {[...new Set(prospects.map(p => p.category))].map(cat => (
                     <option key={cat} value={cat}>Filter Kategori: {cat} ({prospects.filter(p => p.category === cat).length})</option>
                   ))}
                 </select>
                 <span className="badge-styled" style={{ whiteSpace: 'nowrap' }}>
                    {campaignCategory === 'All' ? prospects.length : prospects.filter(p => p.category === campaignCategory).length} Prospek Target
                 </span>
               </div>
            </div>

            <div className="search-box" style={{ padding: '1.5rem', background: 'var(--bg-app)' }}>
               <h4 style={{ marginBottom: '1rem' }}>Sapaan Pertama (Opening Trigger)</h4>
               <textarea 
                  className="input-styled" 
                  rows={3} 
                  style={{ border: '1px solid rgba(0,0,0,0.05)', resize: 'none' }}
                  value={openingMsg}
                  onChange={(e) => setOpeningMsg(e.target.value)}
                ></textarea>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Sapaan ini akan dikirim secara *blast*. Balasan dari prospek selanjutnya akan diambil alih mandiri oleh Agen AI.
                </div>
            </div>

            <button 
              className="btn-approve" 
              onClick={handleLaunchCampaign}
              disabled={isLaunching || prospects.length === 0}
              style={{ width: '100%', padding: '1rem', justifyContent: 'center', fontSize: '1.1rem', background: 'var(--sidebar-gradient)', color: 'white' }}
            >
              {isLaunching ? 'Launching...' : (
                <>
                  <Play size={20} fill="currentColor" /> Start Autonomous Outreach
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. Live AI Inbox */}
      {activeSubTab === 'inbox' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '1.5rem', height: '600px' }}>
          
          {/* Conversation List */}
          <div className="ui-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem', borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#F9FAFC' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Live Interactions</h3>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {prospects.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada prospek disetujui.</div>
              ) : (
                prospects.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setActiveChatId(p.id)}
                    style={{ 
                      padding: '1rem 1.2rem', 
                      borderBottom: '1px solid rgba(0,0,0,0.05)', 
                      cursor: 'pointer',
                      background: activeChatId === p.id ? 'var(--bg-app)' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600 }}>{p.company_name}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {p.category} • {p.area_region}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="ui-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8F9FB' }}>
            {activeChatId ? (
              <>
                {/* Chat Header */}
                <div style={{ padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A6CF7' }}>
                       <User size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{prospects.find(p => p.id === activeChatId)?.company_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>via WhatsApp Business</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Bot size={16} /> AI Active
                  </div>
                </div>

                {/* Chat Messages */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                       <MessageCircle size={48} style={{ marginBottom: '1rem' }} />
                       <p>Belum ada percakapan dengan prospek ini.</p>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isProspect = msg.sender_type === 'prospect';
                      const isAI = msg.sender_type === 'ai';
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isProspect ? 'flex-start' : 'flex-end', alignItems: 'flex-end', gap: '0.5rem' }}>
                          {isProspect && <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--text-muted)', display: 'flex', alignItems:'center', justifyContent:'center', color:'white' }}><User size={16}/></div>}
                          
                          <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isProspect ? 'flex-start' : 'flex-end' }}>
                             <div style={{ 
                               background: isProspect ? 'white' : (isAI ? 'var(--accent-orange)' : 'var(--sidebar-gradient)'), 
                               color: isProspect ? 'var(--text-main)' : 'white',
                               padding: '0.8rem 1.2rem',
                               borderRadius: '16px',
                               borderBottomLeftRadius: isProspect ? 0 : '16px',
                               borderBottomRightRadius: isProspect ? '16px' : 0,
                               boxShadow: 'var(--shadow-card)',
                               fontSize: '0.95rem'
                             }}>
                               {msg.content}
                             </div>
                             <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {isAI ? 'Gemini AI Agent' : (isProspect ? 'Prospect (Client)' : 'Dicky (Staff)')}
                             </span>
                          </div>

                          {!isProspect && <div style={{ width: 30, height: 30, borderRadius: '50%', background: isAI ? 'var(--accent-orange)' : 'var(--sidebar-gradient)', display: 'flex', alignItems:'center', justifyContent:'center', color:'white' }}>{isAI ? <Bot size={16}/> : <Edit3 size={16}/>}</div>}
                        </div>
                      )
                    })
                  )}
                </div>

                 {/* Chat Input */}
                 <div style={{ padding: '1rem 1.5rem', background: 'white', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Ketik balasan untuk mengambil alih chat..." 
                        className="input-styled" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        style={{ flex: 1, background: 'var(--bg-app)', border: 'none', padding: '1rem', borderRadius: '24px' }} 
                      />
                      <button 
                        className="btn-approve" 
                        type="submit"
                        disabled={!newMessage.trim()}
                        style={{ borderRadius: '50%', width: 50, height: 50, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Send size={20} />
                      </button>
                    </form>
                 </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                 <p>Pilih prospek di samping untuk memulai obrolan.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
