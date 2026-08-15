import { useState, useEffect } from 'react';
import { Search, Eye, Download, Send, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AllOffersPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await api.get('/admin/offers');
        setOffers(res.data || []);
      } catch (err) {
        toast.error('Failed to load offers');
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const departments = [...new Set(offers.map(o => o.department).filter(Boolean))];

  const filteredOffers = offers.filter(o => {
    const matchesSearch = o.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.candidate_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesDept = deptFilter === 'all' || o.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const handleResend = async (id) => {
    try {
      await api.post(`/offers/${id}/resend`);
      toast.success('Offer resent successfully');
    } catch (err) {
      toast.error('Failed to resend offer');
    }
  };

  const handleDownload = async (id, name) => {
    try {
      const response = await api.get(`/offers/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}_Offer_Letter.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to download PDF.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>
          All Offers Directory
        </h1>
        <p style={{ color: 'var(--color-body)', margin: '0.3rem 0 0', fontSize: '0.875rem' }}>
          Global view of all generated offers across all departments.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-muted)' }} />
              <input 
                type="text" 
                placeholder="Search candidate..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '2.25rem', width: 220 }}
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Sent">Sent</option>
              <option value="Failed">Failed</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={inputStyle}>
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Candidate</th>
                <th style={thStyle}>Role & Dept</th>
                <th style={thStyle}>Created By</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created At</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}><div className="loader" /></td></tr>
              ) : filteredOffers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>No offers match the filters.</td></tr>
              ) : (
                filteredOffers.map(offer => (
                  <tr key={offer.id || offer.candidate_email} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{offer.candidate_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{offer.candidate_email}</div>
                    </td>
                    <td style={tdStyle}>
                      <div>{offer.designation}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{offer.department}</div>
                    </td>
                    <td style={tdStyle}>{offer.users?.name || offer.generated_by || '-'}</td>
                    <td style={tdStyle}>
                      <span style={getStatusBadgeStyle(offer.status)}>{offer.status}</span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                      {new Date(offer.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => navigate(`/offers/${offer.id}`)} title="View Detail" style={iconBtnStyle}>
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleDownload(offer.id, offer.candidate_name)} title="Download PDF" style={iconBtnStyle}>
                          <Download size={16} />
                        </button>
                        <button onClick={() => handleResend(offer.id)} title="Resend Email" style={iconBtnStyle}>
                          {offer.status === 'Failed' ? <RotateCcw size={16} color="#DC2626" /> : <Send size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function getStatusBadgeStyle(status) {
  const base = { padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' };
  switch(status) {
    case 'Sent': return { ...base, background: '#D1FAE5', color: '#065F46' };
    case 'Failed': return { ...base, background: '#FEE2E2', color: '#991B1B' };
    case 'Accepted': return { ...base, background: '#DCFCE7', color: '#166534' };
    case 'Rejected': return { ...base, background: '#F3F4F6', color: '#374151' };
    case 'Expired': return { ...base, background: '#FEF3C7', color: '#92400E' };
    default: return { ...base, background: '#DBEAFE', color: '#1E40AF' }; // Pending
  }
}

// Styles
const cardStyle = {
  background: '#fff',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '1.5rem',
  marginBottom: '2rem'
};

const inputStyle = {
  padding: '0.6rem 0.75rem',
  borderRadius: 'var(--radius-button)',
  border: '1px solid #E5E7EB',
  outline: 'none',
  fontSize: '0.85rem',
  boxSizing: 'border-box'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left'
};

const thStyle = {
  padding: '1rem 0.5rem',
  borderBottom: '2px solid #E5E7EB',
  color: 'var(--color-muted)',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '1rem 0.5rem',
  color: 'var(--color-heading)',
  fontSize: '0.9rem'
};

const iconBtnStyle = {
  background: '#F3F4F6',
  border: 'none',
  borderRadius: '6px',
  padding: '0.4rem',
  cursor: 'pointer',
  color: '#4B5563',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
