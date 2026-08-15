import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../services/api';
import { Users, FileText, Send, XCircle, AlertCircle } from 'lucide-react';

// KpiCard Component (reused from Dashboard style)
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

function SkeletonLoader() {
  return (
    <div style={{ background: '#f9f9f9', height: 200, borderRadius: 'var(--radius-inner)', animation: 'pulse 1.5s infinite ease-in-out' }} />
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  
  // Add pulse animation style dynamically
  useEffect(() => {
    if (!document.getElementById('skeleton-pulse')) {
      const style = document.createElement('style');
      style.id = 'skeleton-pulse';
      style.innerHTML = `@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, offersRes, analyticsRes] = await Promise.all([
          api.get('/admin/users').catch(() => ({ data: [] })),
          api.get('/admin/offers').catch(() => ({ data: [] })),
          api.get('/analytics/summary').catch(() => ({ data: { monthly: [] } }))
        ]);
        
        setUsers(usersRes.data || []);
        setOffers(offersRes.data || []);
        setMonthlyTrend(analyticsRes.data?.monthly || []);
      } catch (err) {
        console.error('Failed to fetch admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derived Stats
  const systemUsers = users.length;
  const totalOffers = offers.length;
  const emailsSent = offers.filter(o => o.status === 'Sent').length;
  const emailsFailed = offers.filter(o => o.status === 'Failed').length;

  // Chart Data
  const deptData = useMemo(() => {
    const counts = {};
    offers.forEach(o => {
      const d = o.department || 'Unknown';
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [offers]);  // Export handler
  const handleExport = async () => {
    try {
      const response = await api.get(`/offers/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-offers-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--color-body)', margin: '0.3rem 0 0', fontSize: '0.875rem' }}>
          System overview and quick actions.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard icon={<Users size={20} />}       label="System Users" value={loading ? '-' : systemUsers} iconBg="#EDE9FF" iconColor="var(--color-primary)" />
        <KpiCard icon={<FileText size={20} />}    label="Total Offers" value={loading ? '-' : totalOffers} iconBg="#E0F2FE" iconColor="#0284C7" />
        <KpiCard icon={<Send size={20} />}        label="Emails Sent"  value={loading ? '-' : emailsSent}  iconBg="#D1FAE5" iconColor="#059669" />
        <KpiCard icon={<XCircle size={20} />}     label="Emails Failed" value={loading ? '-' : emailsFailed} iconBg="#FEE2E2" iconColor="#DC2626" />
      </div>

      {/* Failed Emails Alert Banner */}
      {!loading && emailsFailed > 0 && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-inner)',
          padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#991B1B' }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {emailsFailed} {emailsFailed === 1 ? 'email' : 'emails'} failed to send — review and retry
            </span>
          </div>
        </div>
      )}
      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Department Chart */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Offers by Department</h2>
          <div style={{ height: 260 }}>
            {loading ? <SkeletonLoader /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '0.75rem', fill: 'var(--color-body)' }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Offers Generated (Last 6 Months)</h2>
          <div style={{ height: 260 }}>
            {loading ? <SkeletonLoader /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fill: 'var(--color-body)' }} />
                  <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fill: 'var(--color-body)' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
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
  display: 'flex',
  flexDirection: 'column'
};

const cardTitleStyle = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--color-heading)',
  margin: '0 0 1.25rem 0'
};



// Helpers
function formatRelativeTime(dateString) {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString('en-IN');
}
