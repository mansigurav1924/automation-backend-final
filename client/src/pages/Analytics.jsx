import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import {
  TrendingUp, BarChart2, CheckCircle2, Clock, 
  XCircle, Send, Users, PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function Analytics() {
  const [data, setData] = useState({ summary: {}, byRole: {}, byDepartment: {}, departmentStats: [], monthly: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/summary')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { total = 0, accepted = 0, pending = 0, declined = 0, expired = 0, sent = 0, failed = 0, draft = 0, avgTimeToAcceptDays = 0 } = data.summary;

  const rolesData = Object.entries(data.byRole || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([role, count]) => ({ role, count }));
  const departments = Object.keys(data.byDepartment || {});
  
  const acceptanceRates = (data.departmentStats || []).map(d => ({
    department: d.department,
    rate: d.total > 0 ? Math.round((d.accepted / d.total) * 100) : 0
  })).sort((a, b) => b.rate - a.rate).slice(0, 6);

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

      {/* Middle Row: Monthly Trend (Stacked) & Status Breakdown (Stacked) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Offers by Month (Stacked by Dept) */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <TrendingUp size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-heading)', margin: 0 }}>Offers by Month</h3>
          </div>
          {loading ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Loading…</p> :
           data.monthly.length === 0 ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No data yet.</p> :
           (
             <div style={{ height: 300 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.monthly}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                   <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} dx={-10} allowDecimals={false} />
                   <Tooltip 
                     cursor={{ fill: 'var(--color-primary)', opacity: 0.05 }}
                     contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                   />
                   <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                   {departments.map((dept, i) => (
                     <Bar key={dept} dataKey={dept} stackId="a" fill={COLORS[i % COLORS.length]} />
                   ))}
                 </BarChart>
               </ResponsiveContainer>
             </div>
           )}
        </div>

        {/* Status Breakdown by Department */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Users size={18} color="#8B5CF6" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-heading)', margin: 0 }}>Status by Department</h3>
          </div>
          {loading ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Loading…</p> :
           (!data.departmentStats || data.departmentStats.length === 0) ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No data yet.</p> :
           (
             <div style={{ height: 300 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.departmentStats} layout="vertical" margin={{ left: 40, right: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                   <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} allowDecimals={false} />
                   <YAxis dataKey="department" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-heading)', fontWeight: 600 }} dx={-10} width={120} />
                   <Tooltip 
                     cursor={{ fill: 'var(--color-secondary)', opacity: 0.05 }}
                     contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                   />
                   <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                   <Bar dataKey="accepted" stackId="a" fill="#10B981" name="Accepted" />
                   <Bar dataKey="pending" stackId="a" fill="#FBBF24" name="Pending" />
                   <Bar dataKey="declined" stackId="a" fill="#EF4444" name="Declined" />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           )}
        </div>
      </div>

      {/* Bottom Row: Acceptance Rate & Top Designations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Acceptance Rate by Department */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <PieChartIcon size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-heading)', margin: 0 }}>Acceptance Rate by Department</h3>
          </div>
          {loading ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Loading…</p> :
           acceptanceRates.length === 0 ? <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>No data yet.</p> :
           (
             <div style={{ height: 260 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={acceptanceRates} layout="vertical" margin={{ left: 40 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                   <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} allowDecimals={false} domain={[0, 100]} />
                   <YAxis dataKey="department" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-heading)', fontWeight: 600 }} dx={-10} width={120} />
                   <Tooltip 
                     cursor={{ fill: 'var(--color-primary)', opacity: 0.05 }}
                     contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                     formatter={(value) => [`${value}%`, 'Acceptance Rate']}
                   />
                   <Bar dataKey="rate" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={24} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           )}
        </div>

        {/* Top Designations */}
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
      </div>
    </motion.div>
  );
}
