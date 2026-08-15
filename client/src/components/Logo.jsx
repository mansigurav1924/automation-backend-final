import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Logo({ size = 'md' }) {
  const isLg = size === 'lg';
  const iconSize = isLg ? 60 : 42;
  const iconRadius = isLg ? 18 : 12;
  const lucideSize = isLg ? 28 : 20;
  
  const titleSize = isLg ? '1.6rem' : '1.05rem';
  const subSize = isLg ? '0.75rem' : '0.65rem';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isLg ? '1rem' : '0.75rem', justifyContent: isLg ? 'center' : 'flex-start' }}>
      <motion.div 
        animate={{ 
          boxShadow: ['0 4px 16px rgba(168,85,247,0.3)', '0 4px 24px rgba(245,158,11,0.5)', '0 4px 16px rgba(168,85,247,0.3)'],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: iconSize, height: iconSize,
          borderRadius: iconRadius,
          background: 'linear-gradient(135deg, #a855f7 0%, #f59e0b 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <FileText size={lucideSize} color="#fff" strokeWidth={2.5} />
      </motion.div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 800, fontSize: titleSize, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          RGT <span style={{ color: '#f59e0b' }}>OfferFlow</span>
        </div>
        <div style={{ fontSize: subSize, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: isLg ? 4 : 2, fontWeight: 600 }}>
          Vertex
        </div>
      </div>
    </div>
  );
}
