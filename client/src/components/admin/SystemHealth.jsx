import { useState, useEffect } from 'react';
import { Activity, Server, Database, Mail, Clock } from 'lucide-react';
import api from '../../services/api';

export default function SystemHealth() {
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

  if (loading) {
    return (
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>System Health</h2>
        <div style={{ background: '#f9f9f9', height: 80, borderRadius: 'var(--radius-inner)', animation: 'pulse 1.5s infinite ease-in-out' }} />
      </div>
    );
  }

  if (!health) return null;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Activity size={20} color="var(--color-primary)" />
        <h2 style={{ ...cardTitleStyle, margin: 0 }}>System Health</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
        <HealthIndicator 
          icon={<Database size={16} />} 
          label="Google Sheets API" 
          status={health.googleSheets} 
        />
        <HealthIndicator 
          icon={<Mail size={16} />} 
          label="SMTP Email Service" 
          status={health.smtp} 
        />
        <HealthIndicator 
          icon={<Clock size={16} />} 
          label="Expiry Cron Job" 
          status={health.cronExpiry ? 'ok' : 'pending'} 
          subtitle={health.cronExpiry ? `Last: ${formatTime(health.cronExpiry)}` : 'Not run yet'}
        />
        <HealthIndicator 
          icon={<Clock size={16} />} 
          label="Reminder Cron Job" 
          status={health.cronReminder ? 'ok' : 'pending'} 
          subtitle={health.cronReminder ? `Last: ${formatTime(health.cronReminder)}` : 'Not run yet'}
        />
      </div>
    </div>
  );
}

function HealthIndicator({ icon, label, status, subtitle }) {
  const isOk = status === 'ok';
  const isError = status === 'error';
  const color = isOk ? '#059669' : isError ? '#DC2626' : '#D97706';
  const bg = isOk ? '#D1FAE5' : isError ? '#FEE2E2' : '#FEF3C7';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#F9FAFB', borderRadius: 'var(--radius-inner)', border: '1px solid #F3F4F6' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-heading)' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 500 }}>
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
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const cardStyle = {
  background: '#fff',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  marginBottom: '2rem'
};

const cardTitleStyle = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--color-heading)',
};
