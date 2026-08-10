import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getAuthUser } from '../utils/auth';
import { Search, FileText, CheckCircle2, XCircle, Clock, Users, Send, AlertCircle, PlusCircle, Inbox, ChevronUp, ChevronDown, Filter, Download, Timer } from 'lucide-react';

export default function Dashboard() {
  const [offers, setOffers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [sortCol, setSortCol] = useState('created_at');
  const [sortDesc, setSortDesc] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter]     = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [hrFilter, setHrFilter]         = useState('');
  const [exporting, setExporting]       = useState(false);

  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await api.get('/offers');
        setOffers(response.data);
      } catch (err) {
        console.error('Failed to fetch offers:', err);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else { setSortCol(col); setSortDesc(true); }
  };

  const filtered = useMemo(() => {
    let result = offers;

    if (statusFilter !== 'All') {
      result = result.filter(o => o.status === statusFilter);
    }
    if (deptFilter) {
      result = result.filter(o =>
        (o.department || '').toLowerCase().includes(deptFilter.toLowerCase())
      );
    }
    if (hrFilter) {
      result = result.filter(o =>
        (o.generated_by || '').toLowerCase().includes(hrFilter.toLowerCase())
      );
    }
    if (dateFrom) {
      result = result.filter(o => new Date(o.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      const end = new Date(dateTo); end.setHours(23, 59, 59);
      result = result.filter(o => new Date(o.created_at) <= end);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        (o.candidate_name && o.candidate_name.toLowerCase().includes(q)) ||
        (o.designation && o.designation.toLowerCase().includes(q)) ||
        (o.id && String(o.id).toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => {
      let aVal = a[sortCol];
      let bVal = b[sortCol];
      if (sortCol === 'created_at') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [offers, search, statusFilter, deptFilter, hrFilter, dateFrom, dateTo, sortCol, sortDesc]);

  const stats = {
    total:   offers.length,
    sent:    offers.filter(o => o.status === 'Sent').length,
    pending: offers.filter(o => o.status === 'Draft' || o.status === 'Pending').length,
    expired: offers.filter(o => o.status === 'Expired').length,
    failed:  offers.filter(o => o.status === 'Failed').length,
  };

  // Server-side export — respects active filters
  const exportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (deptFilter)             params.set('dept', deptFilter);
      if (dateFrom)               params.set('from', dateFrom);
      if (dateTo)                 params.set('to', dateTo);

      const response = await api.get(`/offers/export?${params.toString()}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `offers-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

      {/* Page header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--color-body)', margin: '0.3rem 0 0', fontSize: '0.875rem' }}>
            Track and manage all your generated offer letters.
          </p>
        </div>
        <button onClick={exportCSV} disabled={exporting} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {exporting ? <Clock size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* KPI stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard icon={<Users size={20} />}       label="Total Offers" value={stats.total}   iconBg="#EDE9FF" iconColor="var(--color-primary)" />
        <KpiCard icon={<Send size={20} />}         label="Sent"         value={stats.sent}    iconBg="#D1FAE5" iconColor="#059669" />
        <KpiCard icon={<Timer size={20} />}        label="Expired"      value={stats.expired} iconBg="#FEE2E2" iconColor="#9B1C1C" />
        <KpiCard icon={<AlertCircle size={20} />}  label="Failed"       value={stats.failed}  iconBg="#FEE2E2" iconColor="#DC2626" />
      </div>

      {/* Main table card */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F1F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-heading)', margin: 0 }}>All Candidates</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-body)', margin: '0.1rem 0 0' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <div style={{ position: 'relative' }}>
              <Filter size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <select
                className="form-input"
                style={{ paddingLeft: '2rem', width: 145, fontSize: '0.82rem', padding: '0.5rem 0.75rem 0.5rem 2rem', appearance: 'none', cursor: 'pointer' }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Sent">Sent</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            {/* Department Filter */}
            <input
              type="text"
              className="form-input"
              style={{ width: 140, fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
              placeholder="Department…"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            />
            {/* Date Range */}
            <input type="date" className="form-input" style={{ fontSize: '0.82rem', padding: '0.5rem 0.6rem', width: 140 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
            <input type="date" className="form-input" style={{ fontSize: '0.82rem', padding: '0.5rem 0.6rem', width: 140 }} value={dateTo}   onChange={e => setDateTo(e.target.value)}   title="To date" />
            
            {/* HR Filter (Admin Only) */}
            {isAdmin && (
              <input
                type="text"
                className="form-input"
                style={{ width: 140, fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                placeholder="HR Email…"
                value={hrFilter}
                onChange={e => setHrFilter(e.target.value)}
              />
            )}
            
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem', width: 200, fontSize: '0.82rem', padding: '0.5rem 0.75rem 0.5rem 2rem' }}
                placeholder="Search candidates…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <SortHeader label="Candidate" col="candidate_name" currentCol={sortCol} desc={sortDesc} onClick={() => toggleSort('candidate_name')} />
                <SortHeader label="Role" col="designation" currentCol={sortCol} desc={sortDesc} onClick={() => toggleSort('designation')} />
                {isAdmin && <SortHeader label="Generated By" col="generated_by" currentCol={sortCol} desc={sortDesc} onClick={() => toggleSort('generated_by')} />}
                <SortHeader label="Date Issued" col="created_at" currentCol={sortCol} desc={sortDesc} onClick={() => toggleSort('created_at')} />
                <SortHeader label="Status" col="status" currentCol={sortCol} desc={sortDesc} onClick={() => toggleSort('status')} />
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    <td><div className="skeleton" style={{ height: 16, width: 24 }}></div></td>
                    <td><div className="skeleton" style={{ height: 16, width: 140 }}></div></td>
                    <td><div className="skeleton" style={{ height: 16, width: 120 }}></div></td>
                    {isAdmin && <td><div className="skeleton" style={{ height: 16, width: 120 }}></div></td>}
                    <td><div className="skeleton" style={{ height: 16, width: 80 }}></div></td>
                    <td><div className="skeleton" style={{ height: 24, width: 70, borderRadius: 12 }}></div></td>
                    <td style={{ textAlign: 'right' }}><div className="skeleton" style={{ height: 28, width: 28, borderRadius: 8, display: 'inline-block' }}></div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                    <td colSpan={isAdmin ? "7" : "6"} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--color-muted)' }}>
                        <Inbox size={32} strokeWidth={1.5} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-heading)', margin: '0 0 0.5rem' }}>No offers found</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-body)', maxWidth: 300, margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                        {search ? "We couldn't find any candidates matching your search query." : "You haven't generated any offer letters yet. Let's get started!"}
                      </p>
                      <Link to="/generate" className="btn btn-primary">
                        <PlusCircle size={16} /> Generate New Offer
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((offer, i) => (
                  <tr key={offer.id} style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = `/offers/${offer.id}`}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFF'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8rem', width: 40 }}>{i + 1}</td>
                    <td className="td-name">{offer.candidate_name}</td>
                    <td>{offer.designation}</td>
                    {isAdmin && <td>{offer.generated_by || 'N/A'}</td>}
                    <td>{new Date(offer.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td><StatusBadge status={offer.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/offers/${offer.id}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          background: '#F5F3FF', border: 'none', borderRadius: 8,
                          padding: '0.4rem 0.5rem', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          textDecoration: 'none', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#EDE9FF'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F5F3FF'}
                        title="View Details"
                      >
                        <FileText size={15} color="var(--color-primary)" />
                      </Link>
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

/* ── Sub-components ── */

function KpiCard({ icon, label, value, iconBg, iconColor }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 'var(--radius-inner)',
      boxShadow: '0 2px 16px rgba(27,20,69,0.06)',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-heading)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-body)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Sent:    { bg: '#D1FAE5', color: '#065F46', icon: <CheckCircle2 size={12} />, label: 'Sent' },
    Pending: { bg: '#FEF3C7', color: '#92400E', icon: <Clock size={12} />,        label: 'Pending' },
    Draft:   { bg: '#FEF3C7', color: '#92400E', icon: <Clock size={12} />,        label: 'Pending Approval' },
    Failed:  { bg: '#FEE2E2', color: '#991B1B', icon: <XCircle size={12} />,      label: 'Failed' },
    Expired: { bg: '#F3F4F6', color: '#6B7280', icon: <Timer size={12} />,        label: 'Expired' },
  };
  const s = map[status] || map['Pending'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.color,
      borderRadius: 9999,
      padding: '0.25rem 0.65rem',
      fontSize: '0.72rem', fontWeight: 700,
      letterSpacing: '0.04em',
    }}>
      {s.icon}{s.label}
    </span>
  );
}

function SortHeader({ label, col, currentCol, desc, onClick }) {
  const isActive = currentCol === col;
  return (
    <th onClick={onClick} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {label}
        <span style={{ display: 'inline-flex', flexDirection: 'column', color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}>
          {(!isActive || !desc) && <ChevronUp size={12} style={{ marginBottom: -4, opacity: isActive && !desc ? 1 : 0.3 }} />}
          {(!isActive || desc) && <ChevronDown size={12} style={{ opacity: isActive && desc ? 1 : 0.3 }} />}
        </span>
      </div>
    </th>
  );
}
