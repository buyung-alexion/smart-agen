import React from 'react';
import { Database, Users, Building2, MapPin, TrendingUp, ArrowUpRight } from 'lucide-react';

interface StatsBarProps {
  totalLeads: number;
  newLeadsToday: number;
  activeRegions: number;
  projectedValue: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ 
  totalLeads, 
  newLeadsToday, 
  activeRegions,
  projectedValue
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
      
      {/* Total Leads Card */}
      <div className="ui-card stat-card-gradient gradient-pink">
        <div className="stat-header">
          <Database size={24} />
          <div className="stat-chart-mini">
            <svg viewBox="0 0 100 40" width="100" height="40">
              <path d="M0,35 Q25,10 50,25 T100,5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
        </div>
        <div className="stat-footer">
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '4px' }}>Total Database</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{totalLeads}</div>
          </div>
          <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={16} /> Live
          </div>
        </div>
      </div>

      {/* Leads Today Card */}
      <div className="ui-card stat-card-gradient gradient-purple">
        <div className="stat-header">
          <Users size={24} />
          <div className="stat-chart-mini">
             <svg viewBox="0 0 100 40" width="100" height="40">
              <rect x="0" y="20" width="8" height="15" rx="2" fill="white" opacity="0.3" />
              <rect x="15" y="10" width="8" height="25" rx="2" fill="white" opacity="0.5" />
              <rect x="30" y="25" width="8" height="10" rx="2" fill="white" opacity="0.3" />
              <rect x="45" y="5" width="8" height="30" rx="2" fill="white" opacity="0.7" />
              <rect x="60" y="15" width="8" height="20" rx="2" fill="white" opacity="0.5" />
              <rect x="75" y="0" width="8" height="35" rx="2" fill="white" opacity="0.9" />
              <rect x="90" y="10" width="8" height="25" rx="2" fill="white" opacity="1" />
            </svg>
          </div>
        </div>
        <div className="stat-footer">
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '4px' }}>Leads Today</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{newLeadsToday}</div>
          </div>
          <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={16} /> Fresh
          </div>
        </div>
      </div>

      {/* Active Regions Card */}
      <div className="ui-card stat-card-gradient gradient-cyan">
        <div className="stat-header">
          <MapPin size={24} />
          <TrendingUp size={24} opacity={0.6} />
        </div>
        <div className="stat-footer">
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '4px' }}>Coverage Area</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{activeRegions}</div>
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Regions</div>
        </div>
      </div>

      {/* Conversion Value Card */}
      <div className="ui-card stat-card-gradient gradient-orange">
        <div className="stat-header">
          <Building2 size={24} />
          <div style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 8px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>ESTIMATED</div>
        </div>
        <div className="stat-footer">
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '4px', color: '#333' }}>Projected Value</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {projectedValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>ACTIVE</div>
        </div>
      </div>
      
    </div>
  );
};
