import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { SearchPanel } from './components/SearchPanel'
import { StatsBar } from './components/StatsBar'
import { SmartActionHub } from './components/SmartActionHub'
import { SettingsHub } from './components/SettingsHub'
import { DataTable } from './components/DataTable'
import { Zap, Search, Bell, Edit3, Compass, Hexagon } from 'lucide-react'
import { 
  BarChart as ReBarChart, Bar, 
  ResponsiveContainer, 
} from 'recharts'
import type { Lead } from './types'
import { supabase } from './lib/supabase'
import { searchLeads } from './lib/searchService'

// Mock Data for Charts
const barData = [
  { name: '56', v1: 40, v2: 60 },
  { name: '51', v1: 50, v2: 30 },
  { name: '28', v1: 30, v2: 20 },
  { name: '54', v1: 60, v2: 40 },
  { name: '37', v1: 70, v2: 30 },
  { name: '52', v1: 45, v2: 55 },
];

function App() {
  const [activeTab, setActiveTab] = useState('smartlead');
  const [activeSubTab, setActiveSubTab] = useState('persona'); 
  
  const [scrapedLeads, setScrapedLeads] = useState<Lead[]>([]);
  const [prospects, setProspects] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 1. Initial Load from Supabase
  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    const { data, error } = await supabase
      .from('prospeks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProspects(data);
    if (error) console.error('Error fetching prospects:', error);
  };

  const totalLeads = prospects.length + 1250; 
  const newLeadsToday = prospects.length + 24;

  // 2. Real Search Implementation
  const handleSearch = async (category: string, location: string, depth: string) => {
    setIsLoading(true);
    const results = await searchLeads(category, location, depth);
    setScrapedLeads(results);
    setIsLoading(false);
  };

  // 3. Approval Logic (Save to DB)
  const handleApprove = async (id: string) => {
    const leadToApprove = scrapedLeads.find(l => l.id === id);
    if (!leadToApprove) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('prospeks')
      .insert([{
        company_name: leadToApprove.company_name,
        category: leadToApprove.category,
        address: leadToApprove.address,
        area_region: leadToApprove.area_region,
        phone_number: leadToApprove.phone_number,
        map_location: leadToApprove.map_location,
        rating: leadToApprove.rating,
        status: 'Approved'
      }]);

    if (!error) {
      // Refresh list
      fetchProspects();
      // Remove from candidate list
      setScrapedLeads(prev => prev.filter(l => l.id !== id));
    } else {
      console.error('Error saving lead:', error);
      alert('Failed to save lead to database.');
    }
    setIsSaving(false);
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="main-content">
          <header className="top-header">
            <div className="header-left-pills">
              <div className="pill-group-aesthetic">
                {activeTab === 'action' && (
                  <>
                    <div 
                      className={`pill-aesthetic ${activeSubTab === 'persona' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('persona')}
                    >
                      AI Persona
                    </div>
                    <div 
                      className={`pill-aesthetic ${activeSubTab === 'campaign' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('campaign')}
                    >
                      Campaign
                    </div>
                    <div 
                      className={`pill-aesthetic ${activeSubTab === 'inbox' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('inbox')}
                    >
                      AI Inbox
                    </div>
                  </>
                )}
                
                {activeTab === 'prospek' && (
                  <>
                    <div className="pill-aesthetic active">All Channels</div>
                    <div className="pill-aesthetic">WhatsApp</div>
                    <div className="pill-aesthetic">Email</div>
                  </>
                )}
  
                {activeTab === 'smartlead' && (
                  <>
                    <div className="pill-aesthetic active">Deep Extraction</div>
                    <div className="pill-aesthetic">Web Search</div>
                  </>
                )}
  
                {activeTab === 'dashboard' && (
                  <>
                    <div className="pill-aesthetic active">Global Overview</div>
                    <div className="pill-aesthetic">Weekly Report</div>
                  </>
                )}
              </div>
            </div>

            <div className="header-right-actions">
              <div className="action-icon">
                <Search size={22} />
              </div>
              <div className="action-icon">
                <Bell size={22} />
                <span className="dot"></span>
              </div>
              <div className="user-profile">
                <img 
                  src="https://ui-avatars.com/api/?name=Eliza+W&background=7028FA&color=fff" 
                  className="user-avatar" 
                  alt="Avatar" 
                />
              </div>
              <div className="action-icon">
                <MoreHorizontal size={22} />
              </div>
            </div>
          </header>

          <div className="content-canvas">
            {activeTab === 'dashboard' && (
              <div className="bento-dashboard">
                
                {/* Wave Chart Panel */}
                <div className="ui-card bento-item-large">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Lead Performance</h4>
                    <MoreHorizontal size={20} color="var(--text-muted)" cursor="pointer" />
                  </div>
                  <div style={{ height: '220px', marginLeft: '-20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={waveData}>
                        <defs>
                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF5E89" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FF5E89" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#FF5E89" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Extraction</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>1,678</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Conversion</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>4,112</div>
                    </div>
                  </div>
                </div>

                {/* Progress Circles Panel */}
                <div className="ui-card bento-item-med">
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Validation Rate</h4>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ height: '120px', width: '120px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={donutData1} innerRadius={45} outerRadius={55} paddingAngle={0} dataKey="value">
                              <Cell fill="#FF5E89" />
                              <Cell fill="#EAF0F9" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700, fontSize: '1.1rem' }}>77%</div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '10px' }}>Scraped</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ height: '120px', width: '120px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={donutData2} innerRadius={45} outerRadius={55} paddingAngle={0} dataKey="value">
                              <Cell fill="#2ADBB7" />
                              <Cell fill="#EAF0F9" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700, fontSize: '1.1rem' }}>62%</div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '10px' }}>Approved</div>
                    </div>
                  </div>
                </div>

                {/* Vertical Bar Chart Panel */}
                <div className="ui-card bento-item-small">
                   <div style={{ height: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={barData}>
                        <Bar dataKey="v1" fill="#7028FA" radius={[10, 10, 0, 0]} barSize={12} />
                        <Bar dataKey="v2" fill="rgba(112, 40, 250, 0.15)" radius={[10, 10, 0, 0]} barSize={12} />
                      </ReBarChart>
                    </ResponsiveContainer>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '0 10px' }}>
                      {barData.map(d => <span key={d.name} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{d.name}</span>)}
                   </div>
                </div>

                {/* User Stats Card */}
                <div className="ui-card bento-item-small" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>$3,580</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Projected lead value based on active AI engagement</p>
                  <button className="hero-btn pink">View Reports</button>
                </div>

                {/* System Activity Panel */}
                <div className="ui-card bento-item-small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#FBEC2B', padding: '8px', borderRadius: '12px' }}>
                       <Zap size={20} color="#111" />
                    </div>
                    <div style={{ fontWeight: 600 }}>AI Active Logs</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.9rem' }}>Scraping Module</span>
                       <div style={{ width: '24px', height: '24px', background: 'var(--accent-yellow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Edit3 size={12} color="#111" />
                       </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.9rem' }}>Fonnte Webhook</span>
                       <div style={{ width: '24px', height: '24px', background: 'var(--accent-yellow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Edit3 size={12} color="#111" />
                       </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'smartlead' && (
              <section className="search-hero-v2">
                <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                  <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(42, 219, 183, 0.1)', color: 'var(--accent-green)', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '1px' }}>
                    AI-POWERED EXTRACTION
                  </div>
                  <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-1px' }}>
                    Smart Agent <span style={{ color: 'var(--accent-blue-light)' }}>Search Engine</span>
                  </h2>
                  <p style={{ margin: '10px 0 0 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Sasar market bisnis secara presisi dengan integrasi Google Maps Deep Scraper.
                  </p>
                </div>
                
                <SearchPanel onSearch={handleSearch} isLoading={isLoading} />
                
                {scrapedLeads.length > 0 && (
                  <div style={{ marginTop: '4rem', animation: 'fadeIn 0.5s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '12px', height: '12px', background: 'var(--accent-green)', borderRadius: '50%' }}></div>
                        Raw Leads Found ({scrapedLeads.length})
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Pending approval to Prospek
                      </div>
                    </div>
                    <DataTable leads={scrapedLeads} onApprove={handleApprove} />
                  </div>
                )}
              </section>
            )}

            {activeTab === 'prospek' && (
              <section>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Prospek Database</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Database final untuk prospek terkurasi</p>
                </div>
                <StatsBar totalLeads={totalLeads} newLeadsToday={newLeadsToday} activeRegions={activeRegions} />
                <div style={{ marginTop: '2rem' }}>
                  <DataTable leads={prospects} />
                </div>
              </section>
            )}

            {activeTab === 'action' && (
              <section>
                 <SmartActionHub 
                   prospects={prospects} 
                   activeSubTab={activeSubTab as any} 
                   setActiveSubTab={setActiveSubTab as any} 
                 />
              </section>
            )}

            {activeTab === 'setting' && (
              <section>
                 <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Configuration & Settings</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manajemen API Integrasi</p>
                </div>
                 <SettingsHub />
              </section>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
export default App;
