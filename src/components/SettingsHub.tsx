import React, { useState } from 'react';
import { Database, Key, MessageSquare, Phone, CheckCircle2 } from 'lucide-react';

export const SettingsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'google' | 'supabase' | 'gemini' | 'whatsapp' | 'vercel'>('google');

  const integrations = [
    { id: 'google', title: 'Google API', subtitle: 'Places & Maps Access', icon: Key, color: '#EA4335' },
    { id: 'supabase', title: 'Supabase DB', subtitle: 'Database & Auth', icon: Database, color: '#3ECF8E' },
    { id: 'gemini', title: 'Gemini AI', subtitle: 'LLM & Deep Crawling', icon: MessageSquare, color: '#8E24AA' },
    { id: 'whatsapp', title: 'WA Gateway', subtitle: 'Fonnte Integration', icon: Phone, color: '#25D366' },
    { id: 'vercel', title: 'Vercel Host', subtitle: 'Cloud Deployment', icon: Database, color: '#000000' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '2rem', width: '100%', minHeight: '600px' }}>
      
      {/* Left Panel: The Integrations List (High Visibility V2) */}
      <div className="ui-card settings-panel-v2" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem', fontWeight: 600 }}>API Integrations</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {integrations.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <div 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`integration-item-v2 ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <Icon size={24} color={item.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>{item.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', opacity: 0.6, marginBottom: '0.8rem' }}><CheckCircle2 size={16} color="var(--accent-green)" /> All systems operational</div>
        </div>
      </div>

      {/* Right Panel: The Forms */}
      <div className="ui-card" style={{ padding: '3rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
        {activeTab === 'google' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>Google Maps & extraction API</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Akses database Google Maps secara real-time. Google memberikan <b>$200 FREE Credit setiap bulan</b>.</p>
            
            <div style={{ display: 'grid', gap: '2.5rem', maxWidth: '600px' }}>
              
              {/* Main Google Setup */}
              <div className="ui-card" style={{ padding: '2rem', border: '1px solid rgba(0,0,0,0.05)', background: '#fff' }}>
                <div style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" height="20" alt="Google" /> 
                  Standard Configuration
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem' }}>Official Google API Key</label>
                  <input type="password" className="input-styled" placeholder="AIzaSyB..." style={{ background: 'var(--bg-input)' }} />
                </div>
                <button className="hero-btn" style={{ width: '100%', fontSize: '0.9rem' }}>Save Google Configuration</button>
              </div>

              {/* Serper.dev Alternative (Recommended for Billing Issues) */}
              <div className="ui-card" style={{ padding: '2rem', border: '2px solid var(--accent-blue-light)', background: 'rgba(91, 141, 255, 0.02)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--accent-blue-light)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={20} /> Serper.dev (Recommended Fallback)
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Jika kartu kredit Anda ditolak oleh Google, gunakan Serper.dev. Jauh lebih mudah daftar, GRATIS 2.500 pencarian tiap bulan.
                </p>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem' }}>Serper.dev API Key</label>
                  <input type="password" className="input-styled" placeholder="Masukkan Serper key..." style={{ background: '#fff' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="hero-btn" style={{ flex: 2, fontSize: '0.9rem' }}>Enable Serper.dev</button>
                  <a href="https://serper.dev" target="_blank" rel="noreferrer" className="hero-btn" style={{ flex: 1, fontSize: '0.9rem', background: '#eee', color: '#333', textAlign: 'center' }}>Get Key</a>
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(234, 67, 53, 0.05)', color: '#D93025', fontSize: '0.85rem', border: '1px dashed #EA4335' }}>
                <strong>Tip Billing:</strong> Pastikan kartu Anda mendukung transaksi internasional dan memiliki saldo minimal untuk verifikasi ($1) saat mendaftar di Google Console.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'supabase' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>Supabase Database</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Manajemen data prospek dan log percakapan terpusat secara real-time.</p>
            
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.8rem' }}>Project URL</label>
                <input type="text" className="input-styled" defaultValue="https://ktcmcaghodjobbzalhzh.supabase.co" style={{ background: 'var(--bg-input)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.8rem' }}>Anon / Service Role Key</label>
                <input type="password" className="input-styled" placeholder="eyJhbG..." style={{ background: 'var(--bg-input)' }} />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button className="hero-btn" style={{ width: '100%' }}>Save Supabase Config</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gemini' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>Google Gemini AI</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Otak dari Smart Action untuk deep crawling instruksi otomatis dan obrolan natural.</p>
            
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.8rem' }}>Gemini API Key</label>
                <input type="password" className="input-styled" placeholder="AIzaSyA..." style={{ background: 'var(--bg-input)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.8rem' }}>AI Model Core</label>
                <select className="input-styled" style={{ background: 'var(--bg-input)' }}>
                  <option>gemini-1.5-flash (Fast & Cheap)</option>
                  <option>gemini-1.5-pro (High Quality Detail)</option>
                </select>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button className="hero-btn" style={{ width: '100%' }}>Save Gemini Setup</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>WhatsApp Gateway (Fonnte)</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Integrasi gateway endpoint untuk mengirimkan pesan WhatsApp secara independen tanpa henti.</p>
            
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.8rem' }}>Fonnte API Token</label>
                <input type="password" className="input-styled" placeholder="Masukkan Fonnte Token rahasia..." style={{ background: 'var(--bg-input)' }} />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button className="hero-btn" style={{ width: '100%' }}>Save Gateway Config</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vercel' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>Vercel Cloud Deployment</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Manajemen ID infrastruktur hosting aplikasi frontend ke jaringan publik Vercel.</p>
            
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.8rem' }}>Vercel Project ID</label>
                <input type="text" className="input-styled" defaultValue="prj_aEXbLN66gfYMdqAd82n3k9m0H3gg" style={{ background: 'var(--bg-input)' }} />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button className="hero-btn" style={{ width: '100%', background: 'black', color: 'white' }}>Verify Deployment Status</button>
              </div>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};
