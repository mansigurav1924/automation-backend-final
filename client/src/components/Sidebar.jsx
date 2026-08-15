import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Users, BarChart2, LogOut, Mail } from 'lucide-react';
import { clearAuthData, getAuthUser } from '../utils/auth';
import Logo from './Logo';
import Modal from './Modal';

export default function Sidebar() {
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user = getAuthUser();
  const effectiveRole = user?.role;
  const dashboardPath = effectiveRole === 'admin' ? '/admin/dashboard' : '/manager/dashboard';

  const NAV_ITEMS = [
    { to: dashboardPath,   label: 'Dashboard',   icon: LayoutDashboard },
    { to: '/candidates',   label: 'Candidates',  icon: Users },
    { to: '/generate',     label: 'New Offer',   icon: PlusCircle },
  ];

  const ADMIN_NAV_ITEMS = [
    { to: '/admin/users',  label: 'User Mgmt',   icon: Users },
    { to: '/admin/offers', label: 'All Offers',  icon: LayoutDashboard },
    { to: '/admin/health', label: 'Sys Health',  icon: BarChart2 },
    { to: '/admin/audit',  label: 'Audit Log',   icon: BarChart2 },
  ];

  const handleLogout = () => {
    clearAuthData();
    window.location.href = '/login';
  };

  return (
    <aside style={{
      width: 260,
      minHeight: '100vh',
      background: 'var(--color-heading)',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      boxShadow: '4px 0 24px rgba(27,20,69,0.18)',
    }}>

      {/* Brand */}
      <div style={{ padding: '2rem 1.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Logo size="md" />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1.25rem 1rem' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
          Main Menu
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.7rem 0.875rem',
                    borderRadius: 12,
                    textDecoration: 'none',
                    transition: 'all 0.18s',
                    background: isActive ? 'rgba(91,46,255,0.22)' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}}
                >
                  <div style={{
                    width: 32, height: 32,
                    borderRadius: 9,
                    background: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.18s',
                  }}>
                    <Icon size={15} color={isActive ? '#fff' : 'rgba(255,255,255,0.55)'} />
                  </div>
                  {label}
                  {isActive && (
                    <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary)' }} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {effectiveRole === 'admin' && (
          <>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.7rem 0.875rem',
                        borderRadius: 12,
                        textDecoration: 'none',
                        transition: 'all 0.18s',
                        background: isActive ? 'rgba(91,46,255,0.22)' : 'transparent',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.875rem',
                        borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}}
                    >
                      <div style={{
                        width: 32, height: 32,
                        borderRadius: 9,
                        background: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.18s',
                      }}>
                        <Icon size={15} color={isActive ? '#fff' : 'rgba(255,255,255,0.55)'} />
                      </div>
                      {label}
                      {isActive && (
                        <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary)' }} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          onClick={() => setShowLogoutModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
            padding: '0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
            border: 'none', outline: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Sign Out">
        <p style={{ margin: '0 0 1.5rem', color: 'var(--color-body)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Are you sure you want to sign out of your account? You will need to log back in to access the platform.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowLogoutModal(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleLogout} className="btn btn-primary" style={{ background: '#DC2626', borderColor: '#DC2626' }}>Sign Out</button>
        </div>
      </Modal>

    </aside>
  );
}
