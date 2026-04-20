import React, { useState, useEffect, useRef } from 'react';
import { Database, Key, MessageSquare, Phone, CheckCircle2, User, Image as ImageIcon, Upload } from 'lucide-react';

export const SettingsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'google' | 'supabase' | 'gemini' | 'whatsapp' | 'vercel'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Settings State
  const [config, setConfig] = useState({
    appName: 'Smart Agent',
    appLogo: null as string | null,
    googleKey: '',
    serperKey: '',
    supabaseUrl: 'https://ktcmcaghodjobbzalhzh.supabase.co',
    supabaseKey: '',
    geminiKey: '',
    fonnteToken: '',
    vercelId: 'prj_aEXbLN66gfYMdqAd82n3k9m0H3gg'
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // 1. Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('smart_agent_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error loading config:', e);
      }
    }
  }, []);

  // 2. Save Function
  const handleSave = (section: string) => {
    localStorage.setItem('smart_agent_config', JSON.stringify(config));
    
    // Dispatch a custom event to notify App.tsx that branding has changed
    window.dispatchEvent(new Event('branding_updated'));
    
    setSaveStatus(section);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // 3. Logo Upload Handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, appLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const integrations = [
    { id: 'profile', title: 'App Profile', subtitle: 'Branding & Logo', icon: User, color: '#FF5E89' },
    { id: 'google', title: 'Google API', subtitle: 'Places & Maps Access', icon: Key, color: '#EA4335' },
    { id: 'supabase', title: 'Supabase DB', subtitle: 'Database & Auth', icon: Database, color: '#3ECF8E' },
    { id: 'gemini', title: 'Gemini AI', subtitle: 'LLM & Deep Crawling', icon: MessageSquare, color: '#8E24AA' },
    { id: 'whatsapp', title: 'WA Gateway', subtitle: 'Fonnte Integration', icon: Phone, color: '#25D366' },
    { id: 'vercel', title: 'Vercel Host', subtitle: 'Cloud Deployment', icon: Database, color: '#000000' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '2rem', width: '100%', minHeight: '600px' }}>
      
      {/* Left Panel */}
      <div className="ui-card settings-panel-v2" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem', fontWeight: 600 }}>Settings & API</h3>
        
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
      </div>

      {/* Right Panel */}
      <div className="ui-card" style={{ padding: '3rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
        {activeTab === 'profile' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>Profile & Branding</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Custom nama dan logo aplikasi Anda.</p>
            
            <div style={{ display: 'grid', gap: '2.5rem', maxWidth: '600px' }}>
              <div className="ui-card" style={{ padding: '2rem', border: '1px solid rgba(0,0,0,0.05)', background: '#fff' }}>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Application Name</label>
                  <input 
                    type="text" 
                    className="input-styled" 
                    value={config.appName}
                    onChange={(e) => setConfig({...config, appName: e.target.value})}
                    placeholder="Masukkan nama aplikasi..." 
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Application Logo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '16px', 
                      background: '#F8F9FD', 
                      border: '2px dashed rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {config.appLogo ? (
                        <img src={config.appLogo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={32} color="var(--text-muted)" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <button 
                        className="hero-btn" 
                        style={{ padding: '0.6rem 1.2rem', marginBottom: '8px', width: 'auto' }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={16} /> Upload New Logo
                      </button>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNG, JPG recommended (1:1 ratio)</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '2.5rem' }}>
                  <button 
                    className="hero-btn pink" 
                    onClick={() => handleSave('profile')}
                    style={{ width: '100%' }}
                  >
                    {saveStatus === 'profile' ? '✓ Profile Saved' : 'Apply Branding Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Existing Tabs */}
        {activeTab === 'google' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>Google Maps API</h3>
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Official Google API Key</label>
                <input 
                  type="password" 
                  className="input-styled" 
                  value={config.googleKey}
                  onChange={(e) => setConfig({...config, googleKey: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Serper.dev Key (Fallback)</label>
                <input 
                  type="password" 
                  className="input-styled" 
                  value={config.serperKey}
                  onChange={(e) => setConfig({...config, serperKey: e.target.value})}
                />
              </div>
              <button className="hero-btn" onClick={() => handleSave('google')}>
                {saveStatus === 'google' ? '✓ Saved' : 'Save Google Config'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'supabase' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>Database Configuration</h3>
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Supabase URL</label>
                <input 
                  type="text" 
                  className="input-styled" 
                  value={config.supabaseUrl}
                  onChange={(e) => setConfig({...config, supabaseUrl: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Supabase Key</label>
                <input 
                  type="password" 
                  className="input-styled" 
                  value={config.supabaseKey}
                  onChange={(e) => setConfig({...config, supabaseKey: e.target.value})}
                />
              </div>
              <button className="hero-btn" onClick={() => handleSave('supabase')}>
                {saveStatus === 'supabase' ? '✓ Saved' : 'Save Database Config'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'gemini' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>AI Model Setup</h3>
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Gemini API Key</label>
                <input 
                  type="password" 
                  className="input-styled" 
                  value={config.geminiKey}
                  onChange={(e) => setConfig({...config, geminiKey: e.target.value})}
                />
              </div>
              <button className="hero-btn" onClick={() => handleSave('gemini')}>
                {saveStatus === 'gemini' ? '✓ Saved' : 'Save Gemini Key'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>WhatsApp (Fonnte)</h3>
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Fonnte Token</label>
                <input 
                  type="password" 
                  className="input-styled" 
                  value={config.fonnteToken}
                  onChange={(e) => setConfig({...config, fonnteToken: e.target.value})}
                />
              </div>
              <button className="hero-btn" onClick={() => handleSave('whatsapp')}>
                {saveStatus === 'whatsapp' ? '✓ Saved' : 'Save Gateway Token'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'vercel' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.6rem' }}>Vercel Hosting</h3>
            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.8rem' }}>Vercel Project ID</label>
                <input 
                  type="text" 
                  className="input-styled" 
                  value={config.vercelId}
                  onChange={(e) => setConfig({...config, vercelId: e.target.value})}
                />
              </div>
              <button className="hero-btn" style={{ background: 'black', color: 'white' }} onClick={() => handleSave('vercel')}>
                {saveStatus === 'vercel' ? '✓ Saved' : 'Update Vercel ID'}
              </button>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};
