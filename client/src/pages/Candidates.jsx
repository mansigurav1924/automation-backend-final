import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mail, ExternalLink, Briefcase, Calendar, MapPin, ChevronUp, ChevronDown, CheckCircle2, Clock, AlertTriangle, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function Candidates() {
  console.log('Candidates component rendered');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortMethod, setSortMethod] = useState('name_asc');

  useEffect(() => {
    api.get('/offers')
      .then(r => setOffers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group offers by candidate email → latest offer + history
  const candidateMap = {};
  [...offers].reverse().forEach(o => {
    const key = o.candidate_email || o.candidate_name;
    if (!candidateMap[key]) {
      candidateMap[key] = { email: o.candidate_email, name: o.candidate_name, offers: [] };
    }
    candidateMap[key].offers.push(o);
  });
  const candidates = Object.values(candidateMap)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortMethod === 'name_asc') return a.name.localeCompare(b.name);
      if (sortMethod === 'name_desc') return b.name.localeCompare(a.name);
      if (sortMethod === 'offers_desc') return b.offers.length - a.offers.length;
      return 0;
    });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>Candidates</h1>
          <p style={{ color: 'var(--color-body)', margin: '0.3rem 0 0', fontSize: '0.875rem' }}>{candidates.length} unique candidate{candidates.length !== 1 ? 's' : ''} across all offers.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select
            className="form-input"
            style={{ width: 160, fontSize: '0.82rem', padding: '0.5rem 0.75rem', appearance: 'none', cursor: 'pointer' }}
            value={sortMethod}
            onChange={e => setSortMethod(e.target.value)}
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="offers_desc">Most Offers</option>
          </select>
          <input
            type="text"
            className="form-input"
            style={{ width: 230 }}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted)' }}>Loading candidates…</div>
      ) : candidates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted)' }}>No candidates found.</div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {candidates.map(c => {
            const latest = c.offers[0];
            return (
              <motion.div variants={itemVariants} key={c.email} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Avatar + info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <motion.div whileHover={{ scale: 1.15, rotate: 5 }} style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'default' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </motion.div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-heading)' }}>{c.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} /> {c.email}
                      </div>
                    </div>
                  </div>

                  {/* Offer count badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ background: '#EDE9FF', color: 'var(--color-primary)', borderRadius: 9999, padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
                      {c.offers.length} offer{c.offers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Offer history */}
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F1F8', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {c.offers.map(offer => (
                    <Link key={offer.id} to={`/offers/${offer.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.6rem 0.875rem', borderRadius: 10,
                      background: '#FAFAFF', textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FAFAFF'}
                    >
                      <Briefcase size={14} color="var(--color-primary)" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-heading)', flex: 1 }}>{offer.designation}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        {new Date(offer.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <StatusDot status={offer.status} />
                      <ChevronRightIcon size={14} color="var(--color-muted)" />
                    </Link>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

function StatusDot({ status }) {
  const c = status === 'Sent' ? '#34D399' : status === 'Failed' ? '#F87171' : '#FBBF24';
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />;
}
