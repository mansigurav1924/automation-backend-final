import { Link, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav style={{
      background: 'var(--color-nav-bg)',
      borderBottom: '1px solid var(--color-nav-border)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-nav)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: 'var(--radius-icon)',
            background: 'var(--color-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(245,132,60,0.40)',
          }}>
            <Briefcase size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em' }}>
            Offer<span style={{ color: 'var(--color-highlight)' }}>Flow</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <NavPill to="/" currentPath={location.pathname} icon={<LayoutDashboard size={15} />}>Dashboard</NavPill>
          <NavPill to="/generate" currentPath={location.pathname} icon={<PlusCircle size={15} />}>New Offer</NavPill>
        </div>
      </div>
    </nav>
  );
}

function NavPill({ to, currentPath, children, icon }) {
  const isActive = currentPath === to;
  return (
    <Link to={to} className={`btn btn-nav${isActive ? ' active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      {icon}
      {children}
    </Link>
  );
}
