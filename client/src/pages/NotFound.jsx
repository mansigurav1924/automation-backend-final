import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, FileSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: '2rem' }}
    >
      {/* Big 404 */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <div style={{ fontSize: '9rem', fontWeight: 900, color: '#EDE9FF', lineHeight: 1, letterSpacing: '-0.04em', userSelect: 'none' }}>404</div>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(91,46,255,0.2)' }}>
            <FileSearch size={34} color="var(--color-primary)" />
          </div>
        </div>
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-heading)', margin: '0 0 0.75rem', letterSpacing: '-0.025em' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--color-body)', fontSize: '0.95rem', maxWidth: 400, lineHeight: 1.65, margin: '0 0 2rem' }}>
        The page you're looking for doesn't exist or may have been moved. Double-check the URL or head back to the dashboard.
      </p>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/" className="btn btn-primary">
          <Home size={16} /> Go to Dashboard
        </Link>
        <button className="btn btn-secondary" onClick={() => window.history.back()}>
          Go Back
        </button>
      </div>
    </motion.div>
  );
}
