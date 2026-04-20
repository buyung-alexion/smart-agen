import React, { useState, useEffect } from 'react';
import { Bot, Zap, MessageCircle, Settings2, Play, User, Edit3, Send, CheckCircle2 } from 'lucide-react';
import type { Lead } from '../types';
import { fetchActivePersona, savePersona, type Persona } from '../lib/personaService';
import { fetchMessages, sendMessage, subscribeToMessages, updateMessageStatus, type ChatMessage } from '../lib/messageService';
import { generateAIDraft } from '../lib/aiService';

import { fetchCampaigns, createCampaign, type Campaign } from '../lib/campaignService';
import { updateLeadMuteStatus } from '../lib/leadService';
import { AIPlayground } from './AIPlayground';
import { AIKnowledgeBase } from './AIKnowledgeBase';

interface SmartActionHubProps {
  prospects: Lead[];
  customers: Lead[];
  activeSubTab: 'persona' | 'campaign' | 'inbox' | 'playground' | 'knowledge';
  setActiveSubTab: (tab: 'persona' | 'campaign' | 'inbox' | 'playground' | 'knowledge') => void;
}

export const SmartActionHub: React.FC<SmartActionHubProps> = ({ prospects, customers = [], activeSubTab, setActiveSubTab }) => {
  const [persona, setPersona] = useState<Persona>({
    name: 'Sarah - Sales Representative',
    tone: 'Sopan & Profesional',
    goal: '',
    instructions: '',
    rules: [],
    history: [],
    knowledge_items: [],
    knowledge_base: ''
  });
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const activeLead = ([...prospects, ...customers]).find(p => p.id === activeChatId);

  // Campaign State
  const [campaignCategory, setCampaignCategory] = useState('All');
  const [openingMsg, setOpeningMsg] = useState('Halo {{company_name}}! Kami punya penawaran menarik...');
  const [isLaunching, setIsLaunching] = useState(false);
  const [safetyInterval, setSafetyInterval] = useState(30); // Default 30 seconds
  const [campaignProgress, setCampaignProgress] = useState(0);
  
  // Selection State
  const [targetType, setTargetType] = useState<'prospek' | 'customer'>('prospek');
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());

  // Helper for human-like delay
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // 1. Initial Load
  useEffect(() => {
    const init = async () => {
      const pData = await fetchActivePersona();
      if (pData) setPersona(pData);
    };
    init();
  }, []);
  
  const handleLaunchCampaign = async () => {
    const candidates = targetType === 'prospek' ? prospects : customers;
    const targets = candidates.filter(c => selectedTargetIds.has(c.id));
    
    if (targets.length === 0) {
      alert('Silakan pilih minimal satu target untuk memulai campaign.');
      return;
    }

    setIsLaunching(true);
    setCampaignProgress(0);

    try {
      // 1. Create campaign record
      await createCampaign({
        filter_category: campaignCategory,
        opening_message: openingMsg,
        target_count: targets.length,
        status: 'Running'
      });

      // 2. Real Generation of Drafts
      const savedConfig = localStorage.getItem('smart_agent_config');
      let geminiKey = '';
      if (savedConfig) {
        try {
          geminiKey = JSON.parse(savedConfig).geminiKey;
        } catch (e) {
          console.error('Error parsing config for Campaign:', e);
        }
      }

      for (let i = 0; i < targets.length; i++) {
        const lead = targets[i];
        
        // Generate personalized opener based on persona
        const res = await generateAIDraft(persona, [], geminiKey, lead);
        
        await sendMessage({
          lead_id: lead.id,
          sender_type: 'ai',
          content: res.content,
          is_draft: true
        });

        setCampaignProgress(Math.round(((i + 1) / targets.length) * 100));
        // Small delay to prevent rate limit feel
        await delay(500);
      }

      alert('Campaign Drafted! Silakan cek Inbox untuk meninjau dan mengirim pesan pembuka.');
    } catch (err) {
      console.error(err);
      alert('Failed to launch campaign.');
    } finally {
      setIsLaunching(false);
      setCampaignProgress(0);
    }
  };
  const openWhatsApp = (phone: string, text: string) => {
    // Basic sanitization: remove non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    // Ensure it starts with a country code (if it starts with 0, replace with 62)
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (activeChatId) {
      const loadMessages = async () => {
        const data = await fetchMessages(activeChatId);
        setMessages(data);
      };
      loadMessages();

      // Subscribe to Realtime updates
      const subscription = subscribeToMessages(activeChatId, (newMsg) => {
        setMessages(prev => {
          // Avoid duplicate updates
          if (prev.find(m => m.id === newMsg.id)) return prev;
          
          // Trigger AI Drafting if the new message is from a prospect
          if (newMsg.sender_type === 'prospect') {
            triggerAIDraft(newMsg.lead_id, [...prev, newMsg]);
          }
          
          return [...prev, newMsg];
        });
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeChatId]);

  const triggerAIDraft = async (leadId: string, currentHistory: ChatMessage[]) => {
    if (isThinking) return;
    
    const activeLead = ([...prospects, ...customers]).find(p => p.id === leadId);
    if (activeLead?.ai_muted) return; // DON'T DRAFT IF MUTED
    
    setIsThinking(true);
    
    try {
      // Get API Key from localStorage (SettingsHub)
      const savedConfig = localStorage.getItem('smart_agent_config');
      let geminiKey = '';
      if (savedConfig) {
        try {
          geminiKey = JSON.parse(savedConfig).geminiKey;
        } catch (e) {
          console.error('Error parsing config for Smart Action Hub:', e);
        }
      }

      try {
        const res = await generateAIDraft(persona, currentHistory, geminiKey, activeLead);
        await sendMessage({
          lead_id: leadId,
          sender_type: 'ai',
          content: res.content,
          is_draft: true
        });
        // We could also store res.reasoning if we want to show it in Inbox
      } catch (err) {
        console.error('Draft error:', err);
      } finally {
        setIsThinking(false);
      }
    } catch (err) {
      console.error('Error auto-drafting:', err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleApproveDraft = async (msg: ChatMessage) => {
    if (!msg.id) return;
    const activeLead = ([...prospects, ...customers]).find(p => p.id === activeChatId);
    
    try {
      await updateMessageStatus(msg.id, { is_draft: false });
      
      // Auto-Navigator: Open WhatsApp with the approved text
      if (activeLead?.phone_number) {
        openWhatsApp(activeLead.phone_number, msg.content);
      }
    } catch (err) {
      console.error('Failed to approve draft:', err);
      alert('Gagal menyetujui draf.');
    }
  };

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
    const activeLead = ([...prospects, ...customers]).find(p => p.id === activeChatId);

    try {
      await sendMessage({
        lead_id: activeChatId,
        sender_type: 'human',
        content: newMessage
      });
      
      // Auto-Mute Sarah if human sends a manual message (Optional, but recommended)
      if (activeLead && !activeLead.ai_muted) {
        const type = prospects.find(p => p.id === activeChatId) ? 'prospek' : 'customer';
        await updateLeadMuteStatus(activeChatId, true, type);
      }
      
      // Open WhatsApp for manual response too
      if (activeLead?.phone_number) {
        openWhatsApp(activeLead.phone_number, newMessage);
      }
      
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMute = async () => {
    if (!activeChatId) return;
    const activeLead = ([...prospects, ...customers]).find(p => p.id === activeChatId);
    if (!activeLead) return;
    
    const newStatus = !activeLead.ai_muted;
    const type = prospects.find(p => p.id === activeChatId) ? 'prospek' : 'customer';
    
    try {
      await updateLeadMuteStatus(activeChatId, newStatus, type);
      // Update local state temporarily for immediate feedback (Since props might take a refresh)
      activeLead.ai_muted = newStatus;
      setPersona({...persona}); // Force re-render
    } catch (err) {
      console.error('Failed to toggle mute:', err);
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
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Agent Configuration</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Atur identitas dasar agen AI Anda. Untuk melatih perilakunya, gunakan <b>AI Playground</b>.</p>
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

          <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(112, 40, 250, 0.05)', borderRadius: '16px', border: '1px solid rgba(112, 40, 250, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--sidebar-gradient)', fontWeight: 700 }}>
              <Zap size={20} /> How to Train Your Agent Effectively
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '0.85rem', color: 'var(--text-main)', opacity: 0.9 }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '5px' }}>💡 Knowledge Base Tips:</strong>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <li>Masukkan <b>Daftar Harga</b> produk/layanan Anda.</li>
                  <li>Tuliskan <b>Jam Operasional</b> dan <b>Lokasi</b> kantor.</li>
                  <li>Tambahkan <b>FAQ</b> (Pertanyaan yang sering ditanyakan).</li>
                </ul>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '5px' }}>🎯 Goal Setting:</strong>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <li>Misal: "Dapatkan nomor WhatsApp owner bisnis ini."</li>
                  <li>Misal: "Ajak mereka jadwal meeting zoom besok."</li>
                  <li>Misal: "Berikan link pendaftaran promo diskon 50%."</li>
                </ul>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn-scan-premium" 
              style={{ padding: '0.8rem 3rem', fontSize: '1rem', marginTop: 0 }}
              onClick={handleSavePersona}
              disabled={isSaving}
            >
              {isSaving ? 'Syncing...' : (
                <>
                  <Play size={18} fill="currentColor" /> Deploy AI Instructions
                </>
              )}
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
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Targetkan database untuk disapa secara otonom oleh AI.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div className="search-box" style={{ padding: '1.5rem', background: 'var(--bg-app)' }}>
                  <h4 style={{ marginBottom: '1rem' }}>1. Pilih Sumber Data</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '4px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <button 
                      onClick={() => { setTargetType('prospek'); setSelectedTargetIds(new Set()); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: targetType === 'prospek' ? 'var(--sidebar-gradient)' : 'none', color: targetType === 'prospek' ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      Prospek
                    </button>
                    <button 
                      onClick={() => { setTargetType('customer'); setSelectedTargetIds(new Set()); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: targetType === 'customer' ? 'var(--sidebar-gradient)' : 'none', color: targetType === 'customer' ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      Customer
                    </button>
                  </div>
               </div>

               <div className="search-box" style={{ padding: '1.5rem', background: 'var(--bg-app)' }}>
                  <h4 style={{ marginBottom: '1rem' }}>2. Filter Kategori</h4>
                  <select 
                    className="input-styled" 
                    value={campaignCategory}
                    onChange={(e) => setCampaignCategory(e.target.value)}
                    style={{ border: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    <option value="All">Semua Kategori</option>
                    {[...new Set((targetType === 'prospek' ? prospects : customers).map(p => p.category))].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
               </div>

               <div className="search-box" style={{ padding: '1.5rem', background: 'var(--bg-app)' }}>
                  <h4 style={{ marginBottom: '1rem' }}>4. Sapaan Pertama (Opening)</h4>
                  <textarea 
                    className="input-styled" 
                    rows={3} 
                    style={{ border: '1px solid rgba(0,0,0,0.05)', resize: 'none' }}
                    value={openingMsg}
                    onChange={(e) => setOpeningMsg(e.target.value)}
                  ></textarea>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div className="search-box" style={{ padding: '1.5rem', background: 'var(--bg-app)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>3. Pilih Target ({selectedTargetIds.size})</h4>
                    <button 
                      onClick={() => {
                        const candidates = (targetType === 'prospek' ? prospects : customers).filter(p => campaignCategory === 'All' || p.category === campaignCategory);
                        if (selectedTargetIds.size === candidates.length) {
                          setSelectedTargetIds(new Set());
                        } else {
                          setSelectedTargetIds(new Set(candidates.map(c => c.id)));
                        }
                      }}
                      style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--sidebar-gradient)', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {selectedTargetIds.size > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(targetType === 'prospek' ? prospects : customers)
                      .filter(p => campaignCategory === 'All' || p.category === campaignCategory)
                      .map(p => (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'white', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedTargetIds.has(p.id)}
                            onChange={() => {
                              const newSet = new Set(selectedTargetIds);
                              if (newSet.has(p.id)) newSet.delete(p.id);
                              else newSet.add(p.id);
                              setSelectedTargetIds(newSet);
                            }}
                          />
                          <div style={{ fontSize: '0.9rem' }}>
                            <div style={{ fontWeight: 600 }}>{p.company_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.category} • {p.phone_number}</div>
                          </div>
                        </label>
                      ))}
                  </div>
               </div>

               <button 
                className="btn-approve" 
                onClick={handleLaunchCampaign}
                disabled={isLaunching || selectedTargetIds.size === 0}
                style={{ width: '100%', padding: '1.2rem', justifyContent: 'center', fontSize: '1.1rem', background: 'var(--sidebar-gradient)', color: 'white', borderRadius: '16px' }}
              >
                {isLaunching ? 'Launching...' : (
                  <>
                    <Play size={20} fill="currentColor" /> Start Campaign for {selectedTargetIds.size} Targets
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. AI Playground */}
      {activeSubTab === 'playground' && (
        <div style={{ maxWidth: '900px' }}>
          <AIPlayground persona={persona} onPersonaUpdate={setPersona} />
        </div>
      )}

      {/* 4. AI Knowledge Library */}
      {activeSubTab === 'knowledge' && (
        <AIKnowledgeBase persona={persona} onPersonaUpdate={setPersona} />
      )}

      {/* 3. Live AI Inbox */}
      {activeSubTab === 'inbox' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '1.5rem', height: '600px' }}>
          
          {/* 1. Global Interaction Sidebar (Boss Mode) */}
          <div className="ui-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F9FAFC', borderRight: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '1.2rem', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={18} /> Monitors
              </div>
              <div className="badge-styled" style={{ background: 'var(--accent-purple)', color: 'white' }}>Live</div>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {([...prospects, ...customers]).length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Memory is empty. Start a campaign!</div>
              ) : (
                ([...prospects, ...customers]).map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setActiveChatId(p.id || '')}
                    style={{ 
                      padding: '1.2rem', 
                      borderBottom: '1px solid rgba(0,0,0,0.05)', 
                      cursor: 'pointer',
                      background: activeChatId === p.id ? 'white' : 'transparent',
                      transition: 'all 0.2s ease',
                      borderLeft: activeChatId === p.id ? '4px solid var(--accent-purple)' : '4px solid transparent',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.company_name}</span>
                      {p.status === 'Approved' && <Zap size={14} color="var(--accent-orange)" />}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {p.category}
                        </span>
                        {p.ai_muted && <div style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#eee', borderRadius: '4px', color: '#666' }}>Muted</div>}
                      </div>
                      <div className="status-dot-active" style={{ width: 8, height: 8, background: 'var(--accent-green)', borderRadius: '50%' }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="ui-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8F9FB', height: '100%', minHeight: '600px' }}>
            {activeChatId ? (
              <div key={activeChatId} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* 2. Elite Chat Header */}
                <div style={{ padding: '1.2rem 1.5rem', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 45, height: 45, borderRadius: '14px', background: 'rgba(74, 108, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', boxShadow: '0 4px 12px rgba(74, 108, 247, 0.05)' }}>
                       <User size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{([...prospects, ...customers]).find(p => p.id === activeChatId)?.company_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%' }}></div>
                        Sarah as Smart Agent AI • Listening...
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={handleToggleMute}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid #ddd', 
                        background: activeLead?.ai_muted ? 'var(--accent-orange)' : 'white', 
                        color: activeLead?.ai_muted ? 'white' : 'var(--text-main)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {activeLead?.ai_muted ? <CheckCircle2 size={14}/> : <Bot size={14}/>}
                      {activeLead?.ai_muted ? 'Human Takeover Active' : 'AI Assistant Active'}
                    </button>
                    <div className="badge-styled" style={{ border: '1px solid #10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)' }}>WhatsApp</div>
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
                          
                          <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isProspect ? 'flex-start' : 'flex-end' }}>
                             <div style={{ 
                               background: isProspect ? 'white' : (isAI ? (msg.is_draft ? 'rgba(112, 40, 250, 0.05)' : 'var(--accent-orange)') : 'var(--sidebar-gradient)'), 
                               color: isProspect ? 'var(--text-main)' : (msg.is_draft ? 'var(--text-main)' : 'white'),
                               padding: '1rem 1.4rem',
                               borderRadius: '16px',
                               borderBottomLeftRadius: isProspect ? 0 : '16px',
                               borderBottomRightRadius: isProspect ? '16px' : 0,
                               boxShadow: msg.is_draft ? 'inset 0 0 0 2px rgba(112, 40, 250, 0.1)' : 'var(--shadow-card)',
                               fontSize: '0.95rem',
                               position: 'relative',
                               border: msg.is_draft ? '2px dashed var(--sidebar-gradient)' : 'none'
                             }}>
                               {msg.is_draft && (
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--sidebar-gradient)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                                   <Bot size={12} /> AI Draft (Review Required)
                                 </div>
                               )}
                               {msg.content}

                               {msg.is_draft && (
                                 <div style={{ marginTop: '1.2rem', display: 'flex', gap: '8px' }}>
                                   <button 
                                     onClick={() => handleApproveDraft(msg)}
                                     style={{ 
                                       flex: 1, 
                                       padding: '6px 12px', 
                                       background: 'var(--sidebar-gradient)', 
                                       color: 'white', 
                                       border: 'none', 
                                       borderRadius: '8px', 
                                       fontSize: '0.8rem', 
                                       fontWeight: 600,
                                       cursor: 'pointer',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       gap: '4px'
                                     }}
                                   >
                                     <CheckCircle2 size={14} /> Approve & Send
                                   </button>
                                   <button 
                                     style={{ 
                                       padding: '6px 12px', 
                                       background: '#eee', 
                                       color: '#666', 
                                       border: 'none', 
                                       borderRadius: '8px', 
                                       fontSize: '0.8rem', 
                                       fontWeight: 600,
                                       cursor: 'pointer'
                                     }}
                                   >
                                     Edit
                                   </button>
                                 </div>
                               )}
                             </div>
                             <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {isAI ? (msg.is_draft ? 'Drafted by Gemini' : 'Sent by Gemini AI') : (isProspect ? 'Prospect (Client)' : 'Dicky (Staff)')}
                             </span>
                          </div>

                          {!isProspect && <div style={{ width: 30, height: 30, borderRadius: '50%', background: isAI ? 'var(--accent-orange)' : 'var(--sidebar-gradient)', display: 'flex', alignItems:'center', justifyContent:'center', color:'white' }}>{isAI ? <Bot size={16}/> : <Edit3 size={16}/>}</div>}
                        </div>
                      )
                    })
                  {isThinking && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', opacity: 0.7, padding: '0 1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--sidebar-gradient)', fontWeight: 600 }}>Sarah is thinking...</span>
                      <div className="status-dot-active" style={{ width: 6, height: 6, background: 'var(--sidebar-gradient)' }}></div>
                    </div>
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
              </div>
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
