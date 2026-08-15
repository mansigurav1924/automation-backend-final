import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import {
  ArrowLeft, RefreshCw, CheckCircle2, XCircle, Clock,
  User, Mail, Briefcase, Building2, Calendar, MapPin, DollarSign,
  Send, Loader2, AlertTriangle, ChevronRight, Trash2, FileText, Timer, Activity, Check, X
} from 'lucide-react';
import { getAuthUser } from '../utils/auth';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// ── status helpers ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Sent:    { bg: '#D1FAE5', color: '#065F46', icon: <CheckCircle2 size={13} />, label: 'Sent' },
    Pending: { bg: '#FEF3C7', color: '#92400E', icon: <Clock size={13} />,        label: 'Pending' },
    Failed:  { bg: '#FEE2E2', color: '#991B1B', icon: <XCircle size={13} />,      label: 'Failed' },
    Expired: { bg: '#F3F4F6', color: '#6B7280', icon: <Timer size={13} />,        label: 'Expired' },
  };
  const s = map[status] || map['Pending'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      borderRadius: 9999, padding: '0.35rem 0.9rem',
      fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em',
    }}>
      {s.icon} {s.label}
    </span>
  );
}

// ── single detail row ───────────────────────────────────────────────
function DetailRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.875rem 0', borderBottom: '1px solid #F1F1F8' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-primary)' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--color-heading)', wordBreak: 'break-word' }}>{value || '—'}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
export default function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState(null); // { type: 'success'|'error', text }
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const currentUser = getAuthUser();

  const fetchOffer = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const { data } = await api.get(`/offers/${id}`);
      setOffer(data);
      try {
        const auditRes = await api.get(`/audit/${id}`);
        setAuditLogs(auditRes.data || []);
      } catch (auditErr) {
        console.error('Failed to load audit logs', auditErr);
      }
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOffer(); }, [id]);

  const handleResend = async () => {
    setResending(true);
    setResendMsg(null);
    try {
      const { data } = await api.post(`/offers/${id}/resend`);
      setOffer(prev => ({ ...prev, status: data.status }));
      setResendMsg({ type: 'success', text: data.message });
      fetchOffer(); // Refresh to get latest audit log
    } catch (err) {
      setResendMsg({ type: 'error', text: err.response?.data?.error || 'Failed to resend' });
    } finally {
      setResending(false);
    }
  };

  const handleViewPdf = async () => {
    try {
      const response = await api.get(`/offers/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Failed to load PDF document.');
      console.error(err);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    setResendMsg(null);
    try {
      const { data } = await api.post(`/offers/${id}/approve`);
      setResendMsg({ type: 'success', text: data.message });
      fetchOffer(); // Refresh all state
    } catch (err) {
      setResendMsg({ type: 'error', text: err.response?.data?.error || 'Failed to approve' });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    setResendMsg(null);
    try {
      const { data } = await api.post(`/offers/${id}/reject`);
      setResendMsg({ type: 'success', text: data.message });
      fetchOffer(); // Refresh all state
    } catch (err) {
      setResendMsg({ type: 'error', text: err.response?.data?.error || 'Failed to reject' });
    } finally {
      setRejecting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/offers/${id}`);
      toast.success('Offer deleted successfully.');
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete offer.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: 'var(--color-muted)' }}>
        <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontWeight: 600 }}>Loading offer details…</span>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div style={{ maxWidth: 480, margin: '5rem auto', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#DC2626' }}>
          <AlertTriangle size={28} />
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-heading)', marginBottom: '0.5rem' }}>Offer Not Found</h2>
        <p style={{ color: 'var(--color-body)', marginBottom: '1.5rem' }}>The offer with ID <code style={{ background: '#F3F4F6', padding: '0.15rem 0.4rem', borderRadius: 6, fontSize: '0.8rem' }}>{id}</code> doesn't exist or may have been removed.</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  // ── Detail view ────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
        <Link to="/" style={{ color: 'var(--color-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={14} style={{ marginRight: 4 }} /> Dashboard
        </Link>
        <ChevronRight size={14} color="var(--color-muted)" />
        <span style={{ color: 'var(--color-heading)', fontWeight: 600 }}>Offer #{offer.id}</span>
      </div>

      {/* Page header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>
              Offer Details
            </h1>
          </div>
          <button onClick={() => setShowDeleteModal(true)} className="btn btn-secondary" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
            <Trash2 size={15} /> Delete
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <StatusBadge status={offer.status} />
          {offer.approval_status === 'Pending Approval' ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#F1F1F8', padding: '0.35rem', borderRadius: 9999 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', padding: '0 0.5rem' }}>Pending Approval</span>
              {(currentUser?.role === 'admin' || currentUser?.role === 'hr_head') && (
                <>
                  <button onClick={handleApprove} disabled={approving || rejecting} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem', borderRadius: 9999 }}>
                    {approving ? <Loader2 size={12} className="spin" /> : <Check size={12} />} Approve
                  </button>
                  <button onClick={handleReject} disabled={approving || rejecting} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem', borderRadius: 9999, background: '#FEE2E2', color: '#DC2626', borderColor: '#FEE2E2' }}>
                    {rejecting ? <Loader2 size={12} className="spin" /> : <X size={12} />} Reject
                  </button>
                </>
              )}
            </div>
          ) : offer.status === 'Expired' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#9B1C1C', fontWeight: 600 }}>
              <Timer size={14} /> This offer has expired and cannot be resent.
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending || offer.approval_status === 'Rejected'}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {resending
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Resending…</>
                : <><RefreshCw size={16} /> Resend Email</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Resend feedback */}
      {resendMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className={resendMsg.type === 'success' ? 'alert-success' : 'alert-error'}
          style={{ marginBottom: '1.25rem' }}
        >
          {resendMsg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {resendMsg.text}
        </motion.div>
      )}

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Card 1: Candidate info */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-heading)', margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>👤 Candidate Info</h3>
            <div style={{ height: 3, width: 40, background: 'var(--color-primary)', borderRadius: 9999, marginBottom: '1rem' }} />
            <DetailRow icon={<User size={16} />}     label="Full Name"         value={offer.candidate_name} />
            <DetailRow icon={<Mail size={16} />}     label="Email Address"     value={offer.candidate_email} />
            <DetailRow icon={<Briefcase size={16} />} label="Position"         value={offer.designation} />
            <DetailRow icon={<Building2 size={16} />} label="Department"       value={offer.department} />
          </motion.div>

          {/* Card 2: Internship info */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-heading)', margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>📋 Internship Details</h3>
            <div style={{ height: 3, width: 40, background: 'var(--color-secondary)', borderRadius: 9999, marginBottom: '1rem' }} />
            <DetailRow icon={<Calendar size={16} />}  label="Start Date"        value={offer.start_date} />
            <DetailRow icon={<Calendar size={16} />}  label="End Date"          value={offer.end_date} />
            <DetailRow icon={<MapPin size={16} />}    label="Mode"              value={offer.mode} />
            <DetailRow icon={<DollarSign size={16} />} label="Compensation"     value={offer.compensation} />
            {offer.valid_until && (
              <DetailRow
                icon={<Timer size={16} />}
                label="Offer Valid Until"
                value={new Date(offer.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              />
            )}
          </motion.div>
        </div>

        {/* Card 3: PDF Preview */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-heading)', margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>📄 Document Preview</h3>
          <div style={{ height: 3, width: 40, background: 'var(--color-tertiary)', borderRadius: 9999, marginBottom: '1rem' }} />
          
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            transition={{ type: "spring", stiffness: 300 }}
            onClick={handleViewPdf}
            style={{
              width: '100%', height: 340, background: '#F8F7FF', borderRadius: 'var(--radius-inner)',
              border: '1px solid var(--color-input-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', overflow: 'hidden', textDecoration: 'none'
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={28} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-heading)' }}>View PDF Document</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Click to open full size</span>
          </motion.div>
        </motion.div>

        {/* Card 4: Audit Timeline */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '1.75rem', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-heading)', margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>🕒 Activity Log</h3>
          <div style={{ height: 3, width: 40, background: 'var(--color-primary)', borderRadius: 9999, marginBottom: '1.5rem' }} />
          
          {auditLogs.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>No activity recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', paddingLeft: '1rem' }}>
              {/* Vertical line connecting timeline nodes */}
              <div style={{ position: 'absolute', left: '1.4rem', top: '0.5rem', bottom: '0.5rem', width: 2, background: 'var(--color-input-border)' }} />
              
              {auditLogs.map((log, index) => (
                <div key={log.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--color-primary)', border: '3px solid #fff', boxShadow: '0 0 0 2px var(--color-primary-light)', zIndex: 1, marginTop: 4, flexShrink: 0 }} />
                  <div style={{ paddingBottom: index === auditLogs.length - 1 ? 0 : '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-heading)', textTransform: 'capitalize' }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 2 }}>
                      by {log.actor_email}
                    </div>
                    <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Offer">
        <p style={{ margin: '0 0 1.5rem', color: 'var(--color-body)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Are you sure you want to delete the offer for <strong>{offer.candidate_name}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary" disabled={deleting}>Cancel</button>
          <button onClick={handleDelete} className="btn btn-primary" style={{ background: '#DC2626', borderColor: '#DC2626' }} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Offer'}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
