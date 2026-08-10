import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import {
  TrendingUp, BarChart2, PieChart as PieChartIcon, CheckCircle2, Clock, 
  XCircle, Send, Users, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

function StatCard({ icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-inner)', boxShadow: '0 2px 16px rgba(27,20,69,0.06)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-heading)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-body)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState({ summary: {}, byRole: {}, byDepartment: {}, monthly: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/summary')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { total = 0, accepted = 0, pending = 0, declined = 0, expired = 0, sent = 0, failed = 0, draft = 0, avgTimeToAcceptDays = 0 } = data.summary;

  const rolesData = Object.entries(data.byRole || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([role, count]) => ({ role, count }));
  const deptData = Object.entries(data.byDepartment || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([dept, count]) => ({ dept, count }));

  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>Analytics</h1>
        <p style={{ color: 'var(--color-body)', margin: '0.3rem 0 0', fontSize: '0.875rem' }}>Insights across all generated offer letters.</p>
      </div>

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        <StatCard icon={<BarChart2 size={20} />}    label="Total Offers"    value={total}           iconBg="#EDE9FF" iconColor="var(--color-primary)" />
        <StatCard icon={<CheckCircle2 size={20} />}  label="Accepted"        value={accepted}        iconBg="#D1FAE5" iconColor="#059669" />
        <StatCard icon={<Clock size={20} />}         label="Time to Accept"  value={`${avgTimeToAcceptDays}d`} iconBg="#DBEAFE" iconColor="#2563EB" />
        <StatCard icon={<Clock size={20} />}         label="Pending"         value={pending}         iconBg="#FEF3C7" iconColor="#D97706" />
        <StatCard icon={<XCircle size={20} />}       label="Declined"        value={declined}        iconBg="#FEE2E2" iconColor="#DC2626" />
      </div>

      {/* Middle Row: Bar Chart & Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Offers by month */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <TrendingUp size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-heading)', margin: 0 }}>Offers by Month</h3>
          </div>
          {loading ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Loading…</p> :
           data.monthly.length === 0 ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No data yet.</p> :
           (
             <div style={{ height: 250 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.monthly}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                   <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} dx={-10} allowDecimals={false} />
                   <Tooltip 
                     cursor={{ fill: 'var(--color-primary)', opacity: 0.05 }}
                     contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                   />
                   <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           )}
        </div>

        {/* Status breakdown donut */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <PieChartIcon size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-heading)', margin: 0 }}>Acceptance Rate</h3>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Accepted', value: accepted },
                      { name: 'Other', value: Math.max(0, total - accepted) }
                    ]}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={70}
                    startAngle={90} endAngle={-270}
                    dataKey="value" stroke="none"
                  >
                    <Cell fill="var(--color-primary)" />
                    <Cell fill="#F1F1F8" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-heading)', lineHeight: 1 }}>{acceptanceRate}%</span>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  { label: 'Sent',    value: sent,     color: '#34D399' },
                  { label: 'Pending', value: pending,  color: '#FBBF24' },
                  { label: 'Draft',   value: draft,    color: '#9CA3AF' },
                  { label: 'Expired', value: expired,  color: '#9B1C1C' },
                  { label: 'Failed',  value: failed,   color: '#DC2626' },
                  { label: 'Declined',value: declined, color: '#F87171' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-body)', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-heading)', marginLeft: 'auto' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Designations & Departments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Top roles */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Send size={18} color="var(--color-tertiary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-heading)', margin: 0 }}>Top Designations</h3>
          </div>
          {loading ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Loading…</p> :
           rolesData.length === 0 ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No data yet.</p> :
           (
             <div style={{ height: 260 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={rolesData} layout="vertical" margin={{ left: 40 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                   <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} allowDecimals={false} />
                   <YAxis dataKey="role" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-heading)', fontWeight: 600 }} dx={-10} width={120} />
                   <Tooltip 
                     cursor={{ fill: 'var(--color-secondary)', opacity: 0.05 }}
                     contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                   />
                   <Bar dataKey="count" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} barSize={24} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           )}
        </div>

        {/* Department Breakdown */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Users size={18} color="#8B5CF6" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-heading)', margin: 0 }}>Department Breakdown</h3>
          </div>
          {loading ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Loading…</p> :
           deptData.length === 0 ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No data yet.</p> :
           (
             <div style={{ height: 260 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={deptData} layout="vertical" margin={{ left: 40 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                   <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} allowDecimals={false} />
                   <YAxis dataKey="dept" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-heading)', fontWeight: 600 }} dx={-10} width={120} />
                   <Tooltip 
                     cursor={{ fill: '#8B5CF6', opacity: 0.05 }}
                     contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                   />
                   <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={24} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
}
