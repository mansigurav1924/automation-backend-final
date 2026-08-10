import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(27,20,69,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
            }}
          />
          <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            padding: '1rem',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                background: '#fff', borderRadius: 'var(--radius-card)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
                width: '100%', maxWidth: 420, pointerEvents: 'auto',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F1F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-heading)' }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
