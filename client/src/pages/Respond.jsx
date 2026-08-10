import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { Building2, Calendar, MapPin, DollarSign, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

export default function Respond() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offer, setOffer] = useState(null);
  const [submitting, setSubmitting] = useState(null); // 'accepted' | 'declined' | null
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const { data } = await api.get(`/respond/${token}`);
        setOffer(data.offer);
        if (data.offer.response) {
          setSuccess(data.offer.response);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Invalid or expired link');
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [token]);

  const handleRespond = async (responseType) => {
    setSubmitting(responseType);
    try {
      await api.post(`/respond/${token}`, { response: responseType });
      setSuccess(responseType);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit response');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <Loader2 size={32} className="spin" color="var(--color-primary)" />
      </div>
    );
  }

  if (error && !offer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '2rem' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <XCircle size={32} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-heading)', marginBottom: '0.5rem' }}>Link Unavailable</h1>
        <p style={{ color: 'var(--color-muted)', textAlign: 'center', maxWidth: 400 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F1F8', background: '#fff' }}>
        <Logo />
      </header>
      
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ background: '#fff', borderRadius: 24, boxShadow: 'var(--shadow-card)', padding: '3rem 2rem', textAlign: 'center', maxWidth: 500, width: '100%' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: success === 'accepted' ? '#D1FAE5' : '#FEE2E2', color: success === 'accepted' ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                {success === 'accepted' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-heading)', marginBottom: '0.75rem' }}>
                Offer {success === 'accepted' ? 'Accepted' : 'Declined'}
              </h2>
              <p style={{ color: 'var(--color-body)', lineHeight: 1.6 }}>
                {success === 'accepted' 
                  ? "Thank you for accepting the offer! We're thrilled to have you join the team. HR will be in touch with your onboarding details shortly."
                  : "Thank you for letting us know. We wish you the best in your future endeavors."}
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#fff', borderRadius: 24, boxShadow: 'var(--shadow-card)', overflow: 'hidden', maxWidth: 600, width: '100%' }}>
              
              <div style={{ padding: '2.5rem 2.5rem 2rem', background: 'linear-gradient(135deg, #1B1445 0%, #302677 100%)', color: '#fff', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>Welcome, {offer.candidate_name.split(' ')[0]}!</h1>
                <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>Review your offer details for <strong>{offer.designation}</strong></p>
              </div>

              <div style={{ padding: '2.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <DetailItem icon={<Building2 />} label="Department" value={offer.department} />
                  <DetailItem icon={<MapPin />} label="Mode" value={offer.mode} />
                  <DetailItem icon={<Calendar />} label="Start Date" value={offer.start_date} />
                  <DetailItem icon={<DollarSign />} label="Compensation" value={offer.compensation} />
                </div>
                
                {error && (
                  <div className="alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>
                )}

                <div style={{ background: '#F8F7FF', border: '1px solid #E5E0FF', borderRadius: 16, padding: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-heading)' }}>Action Required</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-body)' }}>Please respond to this offer by <strong>{new Date(offer.valid_until).toLocaleDateString()}</strong>. After this date, the offer will expire.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => handleRespond('declined')} 
                    disabled={submitting !== null}
                    style={{ flex: 1, padding: '0.875rem', borderRadius: 12, border: '2px solid #F1F1F8', background: 'transparent', color: 'var(--color-muted)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#F1F1F8'; e.currentTarget.style.color = 'var(--color-muted)'; }}
                  >
                    {submitting === 'declined' ? <Loader2 size={18} className="spin" /> : 'Decline Offer'}
                  </button>
                  <button 
                    onClick={() => handleRespond('accepted')} 
                    disabled={submitting !== null}
                    style={{ flex: 2, padding: '0.875rem', borderRadius: 12, border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {submitting === 'accepted' ? <Loader2 size={18} className="spin" /> : <>Accept Offer <ArrowRight size={18} /></>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <div style={{ color: 'var(--color-muted)', marginTop: 2 }}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-heading)', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}
