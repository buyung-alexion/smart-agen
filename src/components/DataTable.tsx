import React from 'react';
import { ExternalLink, Star, CheckSquare, MapPin, Phone } from 'lucide-react';
import type { Lead } from '../types';

interface DataTableProps {
  leads: Lead[];
  onApprove?: (lead: any) => void;
  emptyMessage?: string;
  approveLabel?: string;
  hideApprove?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  leads, onApprove, emptyMessage = "Tidak ada data.", 
  approveLabel = "Approve", 
  hideApprove = false 
}) => {
  if (leads.length === 0) {
    return (
      <div className="ui-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Helper to get accent class based on category
  const getAccentClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('horeca') || cat.includes('resto') || cat.includes('cafe') || cat.includes('catering')) return 'row-accent-pink';
    if (cat.includes('sekolah') || cat.includes('edu') || cat.includes('manufacture')) return 'row-accent-purple';
    if (cat.includes('toko') || cat.includes('shop') || cat.includes('frozen') || cat.includes('trade')) return 'row-accent-cyan';
    if (cat.includes('warung') || cat.includes('daging')) return 'row-accent-orange';
    return 'row-accent-orange';
  };

  return (
    <div className="table-container-v3">
      <table className="modern-table-v3">
        <thead>
          <tr>
            <th>Business Details</th>
            <th>Category</th>
            <th>Contact & Location</th>
            <th>Status</th>
            <th>Trust Score</th>
            {!hideApprove && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className={getAccentClass(lead.category)}>
              <td>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                  {lead.company_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <MapPin size={12} /> {lead.area_region}
                </div>
              </td>
              <td>
                <span className="badge-v3" style={{ background: 'rgba(112, 40, 250, 0.05)', color: 'var(--sidebar-gradient)' }}>
                  {lead.category}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    <Phone size={14} color="var(--accent-green)" /> {lead.phone_number || 'No Phone'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                    {lead.address}
                  </div>
                </div>
              </td>
              <td>
                <span className={`badge-v3 ${lead.status?.toLowerCase() === 'active' ? 'status-badge new' : 'status-badge prospect'}`} style={{ textTransform: 'capitalize' }}>
                  {lead.status || 'Unknown'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ padding: '4px 8px', borderRadius: '8px', background: '#FFF9E5', color: '#B45309', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={14} fill="#F59E0B" color="#F59E0B" /> {lead.rating || 'N/A'}
                  </div>
                </div>
              </td>
              {!hideApprove && (
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {lead.map_location && (
                      <a 
                        href={lead.map_location} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="pill-tag" 
                        style={{ padding: '0.5rem', background: '#F0F2FA' }}
                        title="Open Maps"
                      >
                        <ExternalLink size={16} color="var(--text-muted)" />
                      </a>
                    )}
                    {onApprove && (
                      <button 
                        className="hero-btn" 
                        style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                        onClick={() => onApprove(lead)}
                      >
                        <CheckSquare size={16} style={{ marginRight: '6px' }} /> {approveLabel}
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
