import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Logo from '../components/Logo';

export default function SignUp() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', position: 'relative', overflow: 'hidden'
    }}>
      <div className="glow glow-purple" style={{ width: 500, height: 500, top: -150, right: -100 }} />
      <div className="glow glow-orange" style={{ width: 350, height: 350, bottom: -80, left: -80 }} />

      <div style={{ width: '100%', maxWidth: 440, padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <Logo size="lg" />
        </div>

        <div className="glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
            <ShieldAlert size={48} />
          </div>
          
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Registration Disabled
          </h2>
          
          <p style={{ margin: '0 0 2rem 0', color: 'var(--color-text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
            Public self-registration is currently restricted to ensure system security. 
            Accounts must be provisioned by a system administrator. Please contact your 
            HR department to request access.
          </p>
          
          <Link 
            to="/login"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
