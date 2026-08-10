import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { setAuthData } from '../utils/auth';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

export default function Login({ onLogin }) {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      setAuthData(res.data.token, res.data.user);
      onLogin(res.data.user);
      toast.success('Signed in successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-heading)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative glow */}
      <div className="glow glow-purple" style={{ width: 500, height: 500, top: -150, right: -100 }} />
      <div className="glow glow-orange"  style={{ width: 350, height: 350, bottom: -80, left: -80 }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ width: '100%', maxWidth: 440, padding: '0 1.5rem', position: 'relative', zIndex: 1 }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <Logo size="lg" />
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 'var(--radius-card)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          padding: '2.25rem',
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-heading)', marginBottom: '0.3rem' }}>Sign In</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-body)', marginBottom: '1.75rem' }}>
            Enter your credentials to access the platform.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                <input
                  type="text" required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.2rem' }}
                  placeholder="hr@rgtvertex.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem' }}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2, display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
              {loading
                ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Signing in…</>
                : <><LogIn size={16} /> Sign In</>
              }
            </button>
          </form>

          {/* Demo hint */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-body)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
