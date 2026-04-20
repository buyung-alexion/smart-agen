import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { SearchPanel } from './components/SearchPanel'
import { StatsBar } from './components/StatsBar'
import { SmartActionHub } from './components/SmartActionHub'
import { SettingsHub } from './components/SettingsHub'
import { DataTable } from './components/DataTable'
import { Zap, Search, Bell, Edit3, Compass, Hexagon, MoreHorizontal } from 'lucide-react'
import { 
  BarChart as ReBarChart, Bar, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip
} from 'recharts'
import type { Lead } from './types'
import { getSupabase } from './lib/supabase'
import { searchLeads } from './lib/searchService'

// Mock Data for Charts
const barData = [
  { name: 'Jan', v1: 0, v2: 0 },
  { name: 'Feb', v1: 0, v2: 0 },
  { name: 'Mar', v1: 0, v2: 0 },
  { name: 'Apr', v1: 0, v2: 0 },
  { name: 'May', v1: 0, v2: 0 },
  { name: 'Jun', v1: 0, v2: 0 },
];

const waveData = [
  { name: 'Mon', value: 0 },
  { name: 'Tue', value: 0 },
  { name: 'Wed', value: 0 },
  { name: 'Thu', value: 0 },
  { name: 'Fri', value: 0 },
  { name: 'Sat', value: 0 },
  { name: 'Sun', value: 0 },
];

const donutData1 = [
  { name: 'Scraped', value: 0 },
  { name: 'Remaining', value: 100 },
];

const donutData2 = [
  { name: 'Approved', value: 0 },
  { name: 'Remaining', value: 100 },
];

const activeRegions = 0;

function App() {
  const [activeTab, setActiveTab] = useState('smartlead');
  const [activeSubTab, setActiveSubTab] = useState('persona'); 
  
  const [scrapedLeads, setScrapedLeads] = useState<Lead[]>([]);
  const [prospects, setProspects] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    category: '',
    phone_number: '',
    address: ''
  });

  // Branding State
  const [branding, setBranding] = useState({
    name: 'Smart Agent',
    logo: null as string | null
  });
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Manual Add state
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualAddTarget, setManualAddTarget] = useState<'prospek' | 'customer'>('prospek');
  const [manualLead, setManualLead] = useState({
    company_name: '',
    category: '',
    address: '',
    phone_number: '',
    map_location: ''
  });
  
  const [db, setDb] = useState(getSupabase());

  // 1. Initial Load from Supabase & Local Brading
  useEffect(() => {
    loadBranding();
    fetchProspects();
    fetchCustomers();
    
    // Listen for branding/settings updates
    const handleUpdate = () => {
      loadBranding();
      setDb(getSupabase()); // Refresh DB Client with new keys
    };

    window.addEventListener('branding_updated', handleUpdate);
    return () => window.removeEventListener('branding_updated', handleUpdate);
  }, [db]); // Re-fetch data if DB client changes

  const loadBranding = () => {
    const saved = localStorage.getItem('smart_agent_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.appName || parsed.appLogo) {
          setBranding({
            name: parsed.appName || 'Smart Agent',
            logo: parsed.appLogo || null
          });
        }
      } catch (e) {
        console.error('Error loading branding:', e);
      }
    }
  };

  const fetchProspects = async () => {
    const { data, error } = await db
      .from('prospeks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProspects(data);
    if (error) console.error('Error fetching prospects:', error);
  };

  const fetchCustomers = async () => {
    const { data, error } = await db
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setCustomers(data);
    if (error) console.error('Error fetching customers:', error);
  };

  const totalLeads = prospects.length; 
  const newLeadsToday = prospects.length;
  const projectedValue = prospects.length * 10; // Dynamic Value

  // Filtering logic
  const filteredProspects = prospects.filter(lead => {
    const matchesSearch = lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lead.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || lead.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['All', ...new Set(prospects.map(p => p.category))];

  // 2. Real Search Implementation
  const handleSearch = async (category: string, location: string, depth: string) => {
    setIsLoading(true);
    
    // Get Serper API Key from localStorage (SettingsHub)
    const savedConfig = localStorage.getItem('smart_agent_config');
    let serperKey = '';
    if (savedConfig) {
      try {
        serperKey = JSON.parse(savedConfig).serperKey;
      } catch (e) {
        console.error('Error parsing config for Search:', e);
      }
    }

    try {
       const results = await searchLeads(category, location, depth, serperKey);
       if (results.length === 0) {
         alert('Pencarian tidak membuahkan hasil. Mohon cek kembali Kunci API Serper Anda di menu Settings atau coba ganti lokasi pencarian.');
       }
       setScrapedLeads(results);
    } catch (err) {
       console.error('Search failed:', err);
       alert('Gagal melakukan pencarian. Pastikan Kunci API Serper Anda valid dan memiliki kuota.');
    } finally {
       setIsLoading(false);
    }
  };

  // 3. Approval Logic (Save to DB)
  const handleApprove = async (id: string) => {
    const leadToApprove = scrapedLeads.find(l => l.id === id);
    if (!leadToApprove) return;
    
    setIsSaving(true);
    const { error } = await db
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

  const handleConvertToCustomer = async (lead: Lead) => {
    if (!confirm(`Apakah Anda yakin ingin memindahkan ${lead.company_name} ke Database Customer?`)) return;
    
    setIsSaving(true);
    try {
      // 1. Insert into customers
      const { error: insertError } = await db
        .from('customers')
        .insert([{
          full_name: lead.company_name,
          company_name: lead.company_name,
          category: lead.category,
          address: lead.address,
          phone_number: lead.phone_number,
          status: 'Active'
        }]);

      if (insertError) throw insertError;

      // 2. Remove from prospeks
      const { error: deleteError } = await db
        .from('prospeks')
        .delete()
        .eq('id', lead.id);

      if (deleteError) throw deleteError;

      fetchProspects();
      fetchCustomers();
      alert(`Selamat! ${lead.company_name} sekarang resmi menjadi Customer.`);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses Closing.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProspect = async () => {
    if (!editingLead) return;
    setIsSaving(true);
    try {
      const { error } = await db
        .from('prospeks')
        .update({
          company_name: editFormData.company_name,
          category: editFormData.category,
          phone_number: editFormData.phone_number,
          address: editFormData.address
        })
        .eq('id', editingLead.id);

      if (error) throw error;
      
      fetchProspects();
      setIsEditModalOpen(false);
      setEditingLead(null);
      alert('Data Prospek berhasil diperbarui.');
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProspect = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus prospek ini?')) return;
    
    setIsSaving(true);
    try {
      const { error } = await db
        .from('prospeks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      fetchProspects();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setEditFormData({
      company_name: lead.company_name,
      category: lead.category,
      phone_number: (lead as any).phone_number || '',
      address: lead.address || ''
    });
    setIsEditModalOpen(true);
  };

  const handleManualSave = async () => {
    if (!manualLead.company_name) {
      alert('Nama Bisnis wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const tableName = manualAddTarget === 'customer' ? 'customers' : 'prospeks';
      const payload = manualAddTarget === 'customer' 
        ? {
            full_name: manualLead.company_name,
            company_name: manualLead.company_name,
            category: manualLead.category,
            address: manualLead.address,
            phone_number: manualLead.phone_number,
            status: 'Active'
          }
        : {
            ...manualLead,
            status: 'Approved'
          };

      const { error } = await db
        .from(tableName)
        .insert([payload]);

      if (error) throw error;
      
      if (manualAddTarget === 'customer') fetchCustomers();
      else fetchProspects();
      
      setIsManualAddOpen(false);
      setManualLead({ company_name: '', category: '', address: '', phone_number: '', map_location: '' });
      alert(`${manualAddTarget.charAt(0).toUpperCase() + manualAddTarget.slice(1)} manual berhasil disimpan!`);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data manual.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          appName={branding.name}
          appLogo={branding.logo}
        />
        
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
                      className={`pill-aesthetic ${activeSubTab === 'playground' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('playground')}
                    >
                      AI Playground
                    </div>
                    <div 
                      className={`pill-aesthetic ${activeSubTab === 'knowledge' ? 'active' : ''}`}
                      onClick={() => setActiveSubTab('knowledge')}
                    >
                      AI Knowledge
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
                  <div className="pill-aesthetic active">Global Database</div>
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
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalLeads.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Conversion</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>0</div>
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
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700, fontSize: '1.1rem' }}>0%</div>
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
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700, fontSize: '1.1rem' }}>0%</div>
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
                  <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>$0</div>
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
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Prospek Database</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Database final untuk prospek terkurasi</p>
                  </div>
                  
                  {/* Filter & Actions UI */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button 
                      className="hero-btn" 
                      style={{ height: '45px', padding: '0 1.5rem', background: 'var(--accent-purple)', border: 'none' }}
                      onClick={() => {
                        setManualAddTarget('prospek');
                        setIsManualAddOpen(true);
                      }}
                    >
                      + Add Manual Prospek
                    </button>
                    <div className="search-box" style={{ padding: '0', width: '250px' }}>
                      <input 
                        type="text" 
                        placeholder="Search name or address..." 
                        className="input-styled"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ height: '45px', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                </div>

                <StatsBar 
                  totalLeads={totalLeads} 
                  newLeadsToday={newLeadsToday} 
                  activeRegions={activeRegions} 
                  projectedValue={projectedValue}
                />
                
                <div style={{ marginTop: '2rem' }}>
                  <DataTable 
                    leads={filteredProspects} 
                    onApprove={handleConvertToCustomer} 
                    approveLabel="Close Deal" 
                  />
                </div>
              </section>
            )}

            {activeTab === 'customers' && (
              <section>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>Loyal Customers</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Database pelanggan tetap & riwayat transaksi</p>
                  </div>

                  <button 
                    className="hero-btn" 
                    style={{ height: '45px', padding: '0 1.5rem', background: 'var(--sidebar-gradient)', border: 'none' }}
                    onClick={() => {
                      setManualAddTarget('customer');
                      setIsManualAddOpen(true);
                    }}
                  >
                    + Add Manual Customer
                  </button>
                </div>
                
                {/* Structure Customer Stats */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '1.5rem', 
                  marginBottom: '2.5rem' 
                }}>
                  <div className="ui-card" style={{ 
                    padding: '1.5rem', 
                    background: 'linear-gradient(135deg, rgba(112, 40, 250, 0.08) 0%, rgba(112, 40, 250, 0.02) 100%)',
                    border: '1px solid rgba(112, 40, 250, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--sidebar-gradient)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Customer</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{customers.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semua data terdaftar</div>
                  </div>

                  <div className="ui-card" style={{ 
                    padding: '1.5rem', 
                    background: 'linear-gradient(135deg, rgba(42, 219, 183, 0.08) 0%, rgba(42, 219, 183, 0.02) 100%)',
                    border: '1px solid rgba(42, 219, 183, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Aktif</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {customers.filter(c => c.status === 'Active').length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Berstatus transaksi aktif</div>
                  </div>

                  <div className="ui-card" style={{ 
                    padding: '1.5rem', 
                    background: 'linear-gradient(135deg, rgba(255, 94, 137, 0.08) 0%, rgba(255, 94, 137, 0.02) 100%)',
                    border: '1px solid rgba(255, 94, 137, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-pink)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Non Aktif</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {customers.filter(c => c.status !== 'Active').length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tidak aktif / Pending</div>
                  </div>
                </div>

                <DataTable leads={customers} hideApprove />
              </section>
            )}

            {activeTab === 'action' && (
              <section>
                 <SmartActionHub 
                   prospects={prospects} 
                   customers={customers}
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

      {/* Manual Add Modal */}
      {isManualAddOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="ui-card" style={{ width: '100%', maxWidth: '500px', animation: 'slideUp 0.3s ease' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Add Manual {manualAddTarget.charAt(0).toUpperCase() + manualAddTarget.slice(1)}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="search-box" style={{ padding: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>NAMA BISNIS / PERUSAHAAN</label>
                <input 
                  className="input-styled" 
                  placeholder="Contoh: Toko Berkah" 
                  value={manualLead.company_name}
                  onChange={e => setManualLead({...manualLead, company_name: e.target.value})}
                />
              </div>

              <div className="search-box" style={{ padding: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>KATEGORI BISNIS</label>
                <input 
                  className="input-styled" 
                  placeholder="Contoh: Horeca, General Trade" 
                  value={manualLead.category}
                  onChange={e => setManualLead({...manualLead, category: e.target.value})}
                />
              </div>

              <div className="search-box" style={{ padding: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>NOMOR WHATSAPP</label>
                <input 
                  className="input-styled" 
                  placeholder="62812345678" 
                  value={manualLead.phone_number}
                  onChange={e => setManualLead({...manualLead, phone_number: e.target.value})}
                />
              </div>

              <div className="search-box" style={{ padding: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>ALAMAT LENGKAP</label>
                <input 
                  className="input-styled" 
                  placeholder="Jl. Raya No. 123..." 
                  value={manualLead.address}
                  onChange={e => setManualLead({...manualLead, address: e.target.value})}
                />
              </div>

              <div className="search-box" style={{ padding: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>MAP LINK (OPSIONAL)</label>
                <input 
                  className="input-styled" 
                  placeholder="https://maps.google.com/..." 
                  value={manualLead.map_location}
                  onChange={e => setManualLead({...manualLead, map_location: e.target.value})}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
               <button 
                 className="hero-btn" 
                 style={{ flex: 1, background: '#eee', color: '#666' }}
                 onClick={() => setIsManualAddOpen(false)}
               >
                 Cancel
               </button>
               <button 
                 className="hero-btn pink" 
                 style={{ flex: 2 }}
                 onClick={handleManualSave}
                 disabled={isSaving}
               >
                 {isSaving ? 'Saving...' : 'Simpan Prospek'}
               </button>
            </div>
      {/* 2. Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Edit Data Prospek</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Perbarui informasi detail prospek bisnis Anda.</p>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
              <div className="search-box" style={{ padding: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>NAMA BISNIS / PERUSAHAAN</label>
                <input 
                  className="input-styled" 
                  value={editFormData.company_name}
                  onChange={e => setEditFormData({...editFormData, company_name: e.target.value})}
                />
              </div>

              <div className="search-box" style={{ padding: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>KATEGORI BISNIS</label>
                <input 
                  className="input-styled" 
                  value={editFormData.category}
                  onChange={e => setEditFormData({...editFormData, category: e.target.value})}
                />
              </div>

              <div className="search-box" style={{ padding: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>NOMOR WHATSAPP</label>
                <input 
                  className="input-styled" 
                  value={editFormData.phone_number}
                  onChange={e => setEditFormData({...editFormData, phone_number: e.target.value})}
                />
              </div>

              <div className="search-box" style={{ padding: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block', fontWeight: 600 }}>ALAMAT LENGKAP</label>
                <input 
                  className="input-styled" 
                  value={editFormData.address}
                  onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
               <button 
                 className="hero-btn" 
                 style={{ flex: 1, background: '#eee', color: '#666' }}
                 onClick={() => setIsEditModalOpen(false)}
               >
                 Batal
               </button>
               <button 
                 className="hero-btn cyan" 
                 style={{ flex: 2 }}
                 onClick={handleUpdateProspect}
                 disabled={isSaving}
               >
                 {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default App;
