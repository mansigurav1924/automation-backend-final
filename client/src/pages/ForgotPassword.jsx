import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail]         = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      toast.success('Reset link sent to your email.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', position: 'relative', overflow: 'hidden'
    }}>
      <div className="glow glow-orange" style={{ width: 500, height: 500, top: -150, left: -100 }} />
      
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ width: '100%', maxWidth: 440, padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <Logo size="lg" />
        </div>

        <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)', padding: '2.25rem' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-heading)', marginBottom: '0.5rem' }}>Check your email</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-body)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                If an account exists for <strong>{email}</strong>, we've sent instructions to reset your password.
              </p>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                  <input type="text" required value={email} onChange={e => setEmail(e.target.value)} className="form-input" style={{ paddingLeft: '2.2rem' }} placeholder="hr@rgtvertex.com" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending link…</> : 'Send Reset Link'}
              </button>

              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--color-body)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
