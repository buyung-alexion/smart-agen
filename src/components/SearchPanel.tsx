import React, { useState } from 'react';
import { Search, Loader2, Target, MapPin, Compass, BarChart3 } from 'lucide-react';
import { CATEGORIES } from '../data/categories';

interface SearchPanelProps {
  onSearch: (category: string, location: string, depth: string) => void;
  isLoading: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch, isLoading }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationText, setLocationText] = useState('');
  const [intensity, setIntensity] = useState<'quick' | 'deep' | 'ultra'>('quick');

  const handleSearch = () => {
    if (!selectedCategory || !locationText) return;
    onSearch(selectedCategory, locationText, intensity);
  };

  const isSearchDisabled = !selectedCategory || !locationText || isLoading;

  return (
    <div className="search-container-v2">
      <div className="search-card-premium" style={{ gap: '2rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Category Selection */}
          <div className="search-field-group">
            <label className="search-field-label">
              <Target size={20} color="var(--accent-pink)" /> Business Category
            </label>
            <select 
              className="input-premium" 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Choose Industry...</option>
              {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          {/* Flexible Location Input */}
          <div className="search-field-group">
            <label className="search-field-label">
              <MapPin size={20} color="var(--accent-blue-light)" /> Target Area/Region
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-premium"
                placeholder="e.g. Jakarta Selatan, Bali, Surabaya..."
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Search Intensity (Scale Selector) */}
        <div className="search-field-group">
          <label className="search-field-label">
            <BarChart3 size={20} color="var(--accent-yellow)" /> Search Intensity (Accuracy Depth)
          </label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '10px', 
            background: '#F8F9FD', 
            padding: '8px', 
            borderRadius: '20px' 
          }}>
            {[
              { id: 'quick', label: '20 Leads', desc: 'Quick Scan' },
              { id: 'deep', label: '50 Leads', desc: 'Deep Scan' },
              { id: 'ultra', label: '100 Leads', desc: 'Maximum' }
            ].map((opt) => (
              <div 
                key={opt.id}
                onClick={() => setIntensity(opt.id as any)}
                style={{
                  padding: '12px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: intensity === opt.id ? 'white' : 'transparent',
                  boxShadow: intensity === opt.id ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
                  border: intensity === opt.id ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
                  transition: '0.3s ease'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: intensity === opt.id ? 'var(--sidebar-gradient)' : 'var(--text-main)' }}>{opt.label}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6, color: 'var(--text-muted)' }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Call to Action */}
        <button 
          className="btn-scan-premium"
          onClick={handleSearch}
          disabled={isSearchDisabled}
          style={{ marginTop: '0' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={24} className="spinner" />
              <span>Initializing Agent Engine...</span>
            </>
          ) : (
            <>
              <Search size={24} className="scan-icon-pulse" />
              <span>COMMENCE EXTRACTION</span>
            </>
          )}
        </button>

        {!locationText && !isLoading && (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-1rem' }}>
             <Compass size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
             Enter a keyword or specific area to begin deep search.
          </div>
        )}

      </div>
    </div>
  );
};
