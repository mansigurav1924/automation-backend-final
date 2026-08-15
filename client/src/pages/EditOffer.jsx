import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function EditOffer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/offers/${id}`)
      .then(({ data }) => {
        reset({
          candidateName:  data.candidate_name,
          candidateEmail: data.candidate_email,
          designation:    data.designation,
          department:     data.department,
          startDate:      data.start_date,
          endDate:        data.end_date,
          mode:           data.mode,
          compensation:   data.compensation,
        });
      })
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
        else toast.error('Failed to load offer data.');
      })
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/offers/${id}`, data);
      toast.success('Offer updated and resent!');
      setTimeout(() => navigate(`/offers/${id}`), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update offer.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: 'var(--color-muted)' }}>
        <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontWeight: 600 }}>Loading offer…</span>
      </div>
    );
  }

  if (notFound) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <p style={{ color: 'var(--color-body)', marginBottom: '1rem' }}>Offer not found.</p>
      <Link to="/" className="btn btn-primary"><ArrowLeft size={16} /> Back to Dashboard</Link>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to={`/offers/${id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, background: '#fff', boxShadow: '0 2px 10px rgba(27,20,69,0.08)', color: 'var(--color-heading)', textDecoration: 'none' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>Edit Offer</h1>
          <p style={{ color: 'var(--color-body)', margin: '0.2rem 0 0', fontSize: '0.82rem' }}>Changes will trigger a fresh PDF and re-send the offer email.</p>
        </div>
      </div>

      {success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={16} /> Offer updated and resent! Redirecting…
        </motion.div>
      )}
      {error && <div className="alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Form card */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-tertiary))', borderRadius: '24px 24px 0 0' }} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <Field label="Candidate Name" error={errors.candidateName?.message}>
              <input {...register('candidateName', { required: 'Required' })} className={`form-input${errors.candidateName ? ' error' : ''}`} />
            </Field>
            <Field label="Email Address" error={errors.candidateEmail?.message}>
              <input type="email" {...register('candidateEmail', { required: 'Required' })} className={`form-input${errors.candidateEmail ? ' error' : ''}`} />
            </Field>
            <Field label="Position / Designation" error={errors.designation?.message}>
              <input {...register('designation', { required: 'Required' })} className={`form-input${errors.designation ? ' error' : ''}`} />
            </Field>
            <Field label="Department">
              <input {...register('department')} className="form-input" />
            </Field>
            <Field label="Start Date" error={errors.startDate?.message}>
              <input type="date" {...register('startDate', { required: 'Required' })} className={`form-input${errors.startDate ? ' error' : ''}`} />
            </Field>
            <Field label="End Date" error={errors.endDate?.message}>
              <input type="date" {...register('endDate', { required: 'Required' })} className={`form-input${errors.endDate ? ' error' : ''}`} />
            </Field>
            <Field label="Mode">
              <input {...register('mode')} className="form-input" placeholder="Remote" />
            </Field>
            <Field label="Compensation">
              <input {...register('compensation')} className="form-input" placeholder="Unpaid Internship" />
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
            <Link to={`/offers/${id}`} className="btn btn-secondary">Cancel</Link>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={16} /> Save &amp; Resend</>}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {error && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{error}</span>}
    </div>
  );
}
