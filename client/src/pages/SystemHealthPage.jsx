import { useState, useEffect } from 'react';
import { Activity, Database, Mail, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/admin/health');
        setHealth(res.data);
      } catch (err) {
        console.error('Failed to fetch system health:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>
          System Health
        </h1>
        <p style={{ color: 'var(--color-body)', margin: '0.3rem 0 0', fontSize: '0.875rem' }}>
          Real-time status of system integrations and background jobs.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Activity size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-heading)' }}>Live Diagnostics</h2>
        </div>
        
        {loading ? (
          <div style={{ background: '#f9f9f9', height: 80, borderRadius: 'var(--radius-inner)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ) : !health ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>Failed to load diagnostic data.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <HealthIndicator 
              icon={<Database size={20} />} 
              label="Google Sheets API" 
              status={health.googleSheets} 
            />
            <HealthIndicator 
              icon={<Mail size={20} />} 
              label="SMTP Email Service" 
              status={health.smtp} 
            />
            <HealthIndicator 
              icon={<Clock size={20} />} 
              label="Expiry Cron Job" 
              status={health.cronExpiry ? 'ok' : 'pending'} 
              subtitle={health.cronExpiry ? `Last: ${formatTime(health.cronExpiry)}` : 'Not run yet'}
            />
            <HealthIndicator 
              icon={<Clock size={20} />} 
              label="Reminder Cron Job" 
              status={health.cronReminder ? 'ok' : 'pending'} 
              subtitle={health.cronReminder ? `Last: ${formatTime(health.cronReminder)}` : 'Not run yet'}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function HealthIndicator({ icon, label, status, subtitle }) {
  const isOk = status === 'ok';
  const isError = status === 'error';
  const color = isOk ? '#059669' : isError ? '#DC2626' : '#D97706';
  const bg = isOk ? '#D1FAE5' : isError ? '#FEE2E2' : '#FEF3C7';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: '#F9FAFB', borderRadius: 'var(--radius-inner)', border: '1px solid #F3F4F6' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-heading)' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 500 }}>
            {subtitle || (isOk ? 'Operational' : isError ? 'Error' : 'Pending')}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('en-US');
}

const cardStyle = {
  background: '#fff',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '1.5rem',
  marginBottom: '2rem'
};
