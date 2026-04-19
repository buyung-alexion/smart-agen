import React from 'react';
import { LayoutDashboard, Search, UserCheck, Zap, Settings, Hexagon } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'smartlead', label: 'Target Search', icon: Search },
    { id: 'prospek', label: 'Prospek', icon: UserCheck },
    { id: 'action', label: 'AI Action Hub', icon: Zap },
    { id: 'setting', label: 'Integrations', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-logo">
        <Hexagon size={32} color="var(--accent-yellow)" fill="var(--accent-yellow)" />
        Smart Agent
      </div>
      
      <nav className="nav-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div 
              key={item.id} 
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-status-card">
        <div className="status-indicator">
          <div className="pulse-dot"></div>
          <span>AI Core: Active</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>
          System integrity optimal. All agents are ready for extraction.
        </div>
        <div style={{ 
          height: '4px', 
          width: '100%', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '2px', 
          marginTop: '5px',
          overflow: 'hidden'
        }}>
          <div style={{ width: '85%', height: '100%', background: '#2ADBB7' }}></div>
        </div>
      </div>
    </aside>
  );
};
