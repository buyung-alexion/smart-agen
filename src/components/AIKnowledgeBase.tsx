import React, { useState } from 'react';
import { BookOpen, Plus, Tag, Trash2, Edit3, Briefcase, Package, Calendar, Search } from 'lucide-react';
import { savePersona, type Persona, type KnowledgeItem } from '../lib/personaService';

interface AIKnowledgeBaseProps {
  persona: Persona;
  onPersonaUpdate: (updated: Persona) => void;
}

export const AIKnowledgeBase: React.FC<AIKnowledgeBaseProps> = ({ persona, onPersonaUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState<Partial<KnowledgeItem>>({
    category: 'Product',
    title: '',
    content: ''
  });

  const handleAddItem = async () => {
    if (!newItem.title || !newItem.content) return;
    
    const item: KnowledgeItem = {
      id: Date.now().toString(),
      title: newItem.title,
      content: newItem.content,
      category: newItem.category as any
    };

    const updatedPersona = {
      ...persona,
      knowledge_items: [...(persona.knowledge_items || []), item]
    };

    await savePersona(updatedPersona);
    onPersonaUpdate(updatedPersona);
    setIsAdding(false);
    setNewItem({ category: 'Product', title: '', content: '' });
  };

  const deleteItem = async (id: string) => {
    const updatedItems = (persona.knowledge_items || []).filter(item => item.id !== id);
    const updatedPersona = { ...persona, knowledge_items: updatedItems };
    await savePersona(updatedPersona);
    onPersonaUpdate(updatedPersona);
  };

  const filteredItems = (persona.knowledge_items || []).filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { id: 'Company', icon: <Briefcase size={18} />, color: '#7028FA' },
    { id: 'Product', icon: <Package size={18} />, color: '#FF5E89' },
    { id: 'Event', icon: <Calendar size={18} />, color: '#2ADBB7' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>AI Knowledge Library</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Pusat informasi bisnis yang menjadi "otak" referensi Sarah.</p>
        </div>
        <button 
          className="hero-btn pink" 
          onClick={() => setIsAdding(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={20} /> Add Information
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, padding: 0, background: 'white' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#999' }} />
          <input 
            className="input-styled" 
            placeholder="Cari produk, info perusahaan, atau event..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '3rem', height: '48px', border: '1px solid rgba(0,0,0,0.05)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           {categories.map(cat => (
             <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }}></div>
                {cat.id}: { (persona.knowledge_items || []).filter(i => i.category === cat.id).length }
             </div>
           ))}
        </div>
      </div>

      {/* Grid of Knowledge */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {filteredItems.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: '#f8f9ff', borderRadius: '24px', border: '2px dashed rgba(112,40,250,0.1)' }}>
             <BookOpen size={48} color="var(--accent-purple)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
             <h4 style={{ margin: 0, color: '#666' }}>Belum ada informasi.</h4>
             <p style={{ color: '#999', fontSize: '0.9rem' }}>Klik "Add Information" untuk mulai melatih Sarah.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="ui-card" style={{ padding: '1.5rem', position: 'relative', border: '1px solid rgba(0,0,0,0.02)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  background: categories.find(c => c.id === item.category)?.color + '15',
                  color: categories.find(c => c.id === item.category)?.color,
                  textTransform: 'uppercase'
                }}>
                  {item.category}
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  style={{ background: 'none', border: 'none', color: '#ff5e89', cursor: 'pointer', opacity: 0.5 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>{item.title}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.content}
              </p>
              <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-end' }}>
                 <button style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                   <Edit3 size={14} /> Detail / Edit
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="ui-card" style={{ width: '100%', maxWidth: '600px', animation: 'slideUp 0.3s ease' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Add New Knowledge</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888', marginBottom: '6px', display: 'block' }}>KATEGORI</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setNewItem({...newItem, category: cat.id as any})}
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px', 
                        padding: '10px', 
                        borderRadius: '10px', 
                        border: '1px solid #eee',
                        background: newItem.category === cat.id ? cat.color : 'white',
                        color: newItem.category === cat.id ? 'white' : '#666',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {cat.icon} {cat.id}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888', marginBottom: '6px', display: 'block' }}>JUDUL INFORMASI (Hanya sebagai Label)</label>
                <input 
                  className="input-styled" 
                  placeholder="Misal: Info Harga Bakso Mercon" 
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  style={{ background: '#f8f9ff', border: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888', marginBottom: '6px', display: 'block' }}>KONTEN INFORMASI (Yang akan dibaca Sarah)</label>
                <textarea 
                  className="input-styled" 
                  placeholder="Masukkan detail informasi di sini..." 
                  rows={6}
                  value={newItem.content}
                  onChange={(e) => setNewItem({...newItem, content: e.target.value})}
                  style={{ background: '#f8f9ff', border: 'none', resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
               <button className="hero-btn" style={{ flex: 1, background: '#eee', color: '#666', border: 'none' }} onClick={() => setIsAdding(false)}>Cancel</button>
               <button className="hero-btn pink" style={{ flex: 2 }} onClick={handleAddItem}>Simpan Ke Otak Sarah</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
