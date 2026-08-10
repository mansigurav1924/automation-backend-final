import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

export default function SignUp() {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/signup', { name, email, password, department });
      toast.success('Account created successfully! Please sign in.');
      setTimeout(() => window.location.href = '/login', 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', position: 'relative', overflow: 'hidden'
    }}>
      <div className="glow glow-purple" style={{ width: 500, height: 500, top: -150, right: -100 }} />
      <div className="glow glow-orange"  style={{ width: 350, height: 350, bottom: -80, left: -80 }} />

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ width: '100%', maxWidth: 440, padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <Logo size="lg" />
        </div>

        <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)', padding: '2.25rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            <div>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="form-input" style={{ paddingLeft: '2.2rem' }} placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                <input type="text" required value={email} onChange={e => setEmail(e.target.value)} className="form-input" style={{ paddingLeft: '2.2rem' }} placeholder="hr@rgtvertex.com" />
              </div>
            </div>

            <div>
              <label className="form-label">Department</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                <select value={department} required onChange={e => setDepartment(e.target.value)} className="form-input" style={{ paddingLeft: '2.2rem', appearance: 'none' }}>
                  <option value="" disabled>Select your department</option>
                  <option value="Social Media Intern">Social Media Intern</option>
                  <option value="Sales Development Intern">Sales Development Intern</option>
                  <option value="HR Intern">HR Intern</option>
                  <option value="AI Engineering Intern">AI Engineering Intern</option>
                  <option value="Business Analyst Intern">Business Analyst Intern</option>
                  <option value="Content Creator Intern">Content Creator Intern</option>
                  <option value="Full Stack Intern">Full Stack Intern</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="form-input" style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem' }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2, display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
              {loading ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Creating account…</> : <><UserPlus size={16} /> Sign Up</>}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-body)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in here</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
