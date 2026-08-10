import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [password, setPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or missing reset token.');
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !email) return;
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { email, token, newPassword: password });
      setSuccess(true);
      toast.success('Password successfully reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password. The link might be expired.');
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-heading)', marginBottom: '0.5rem' }}>Password Updated!</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-body)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Your password has been successfully reset. Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                  <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="form-input" style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem' }} placeholder="••••••••" minLength={6} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2, display: 'flex' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Reset Password'}
              </button>
              
              {!token && (
                 <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Go to Login</Link>
                 </div>
              )}
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
