import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (actorFilter) params.actor = actorFilter;
      if (actionFilter) params.action = actionFilter;
      
      const { data } = await api.get('/audit', { params });
      setLogs(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new filter
    fetchLogs();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>
            System Audit Log
          </h1>
          <p style={{ color: 'var(--color-body)', margin: '0.3rem 0 0', fontSize: '0.875rem' }}>
            Comprehensive tracking of all system activity.
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={labelStyle}>Search User (Email)</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-muted)' }} />
              <input 
                type="text" 
                placeholder="actor@example.com" 
                value={actorFilter}
                onChange={e => setActorFilter(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '2.25rem' }}
              />
            </div>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={labelStyle}>Filter by Action</label>
            <select 
              value={actionFilter} 
              onChange={e => setActionFilter(e.target.value)} 
              style={inputStyle}
            >
              <option value="">All Actions</option>
              <option value="Created Offer">Created Offer</option>
              <option value="Updated Offer">Updated Offer</option>
              <option value="Sent Email">Sent Email</option>
              <option value="Email Failed">Email Failed</option>
              <option value="Approved Offer">Approved Offer</option>
              <option value="Rejected Offer">Rejected Offer</option>
              <option value="Candidate Responded">Candidate Responded</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} /> Apply Filters
          </button>
          
          <button type="button" onClick={() => fetchLogs()} className="btn" style={{ background: '#F3F4F6', color: '#374151' }}>
            <RefreshCw size={16} />
          </button>
        </form>

        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Actor</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Target (Offer ID)</th>
                <th style={thStyle}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}><div className="loader" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>No logs found matching your criteria.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ ...tdStyle, color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{log.actor_email || 'System'}</td>
                    <td style={tdStyle}>
                      <span style={{ background: '#F3F4F6', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {log.offer_id ? (
                        <a href={`/offers/${log.offer_id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                          #{String(log.offer_id).substring(0,8)}
                        </a>
                      ) : '-'}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              style={{ ...pageBtnStyle, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            
            <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem' }}>
              Page {page} of {totalPages}
            </span>
            
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages || totalPages === 0}
              style={{ ...pageBtnStyle, opacity: page === totalPages || totalPages === 0 ? 0.5 : 1, cursor: page === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Styles
const cardStyle = {
  background: '#fff',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '1.5rem',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  marginBottom: '0.4rem',
  color: 'var(--color-body)'
};

const inputStyle = {
  padding: '0.6rem 0.75rem',
  borderRadius: 'var(--radius-button)',
  border: '1px solid #E5E7EB',
  outline: 'none',
  fontSize: '0.85rem',
  width: '100%',
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

const pageBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.4rem 0.75rem',
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: '6px',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--color-heading)'
};
