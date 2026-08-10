import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Send, Loader2, Eye, X, Mail, ChevronDown } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function GenerateOffer() {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, getValues } = useForm({
    defaultValues: { duration: "3", mode: "Remote", compensation: "Unpaid Internship" }
  });
  const [status, setStatus]           = useState('idle');
  const [previewPdf, setPreviewPdf]   = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPreviewed, setIsPreviewed] = useState(false);
  const [showEmailCustom, setShowEmailCustom] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody]     = useState('');
  const [templates, setTemplates]     = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [pdfTemplates, setPdfTemplates] = useState([]);
  const [selectedPdfTemplate, setSelectedPdfTemplate] = useState('');

  const startDate = watch("startDate");
  const duration  = watch("duration");

  // Fetch email templates on mount
  useEffect(() => {
    api.get('/templates').then(r => setTemplates(r.data)).catch(() => {});
    api.get('/templates/default').then(r => {
      setEmailSubject(r.data.subject || '');
      setEmailBody(r.data.body_html || '');
    }).catch(() => {});
    api.get('/pdf-templates').then(r => setPdfTemplates(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (startDate && duration && duration !== 'custom') {
      const start = new Date(startDate);
      const months = parseInt(duration, 10);
      if (!isNaN(months)) {
        start.setMonth(start.getMonth() + months);
        setValue("endDate", start.toISOString().split('T')[0]);
      }
    }
  }, [startDate, duration, setValue]);

  const handlePreview = async () => {
    setIsPreviewing(true);
    setPreviewPdf(null);
    try {
      const data = getValues();
      const payload = { ...data, pdfTemplateId: selectedPdfTemplate || undefined };
      const res = await api.post('/offers/preview', payload, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      setPreviewPdf(url);
      setIsPreviewed(true);
    } catch (err) {
      console.error(err);
      let errorMessage = 'Failed to generate preview.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          errorMessage = json.error || errorMessage;
        } catch (e) {
          console.error('Error parsing blob error', e);
        }
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleTemplateChange = async (e) => {
    const id = e.target.value;
    setSelectedTemplate(id);
    if (!id) return;
    try {
      const res = await api.get(`/templates/${id}`);
      setEmailSubject(res.data.subject || '');
      setEmailBody(res.data.body_html || '');
    } catch {}
  };

  const onSubmit = async (data) => {
    setStatus('loading');
    try {
      // Include email customization if user modified it
      const payload = {
        ...data,
        pdfTemplateId: selectedPdfTemplate || undefined,
        ...(showEmailCustom && emailBody ? { emailSubject, emailBody } : {}),
      };
      await api.post('/offers/generate', payload);

      setStatus('success');
      toast.success('Offer letter generated and sent successfully!');
      setTimeout(() => {
        setStatus('idle');
        setPreviewPdf(null);
        setIsPreviewed(false);
        reset();
      }, 3000);

    } catch (err) {
      console.error(err);
      setStatus('idle');
      toast.error(err.response?.data?.error || 'Failed to generate offer. Please try again.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ maxWidth: 760, margin: '0 auto' }}>

      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>
          Generate Offer Letter
        </h1>
        <p style={{ color: 'var(--color-body)', margin: '0.3rem 0 0', fontSize: '0.875rem' }}>
          Fill in the candidate details to automatically generate and email the offer letter.
        </p>
      </div>

      {/* Form card */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Decorative top gradient stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-tertiary) 100%)',
          borderRadius: '24px 24px 0 0',
        }} />

        <form onSubmit={handleSubmit(onSubmit)} style={{ paddingTop: '0.5rem' }}>
          <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Candidate Name */}
            <Field label="Candidate Name" error={errors.candidateName?.message}>
              <input type="text" {...register("candidateName", { required: "Name is required" })}
                className={`form-input${errors.candidateName ? ' error' : ''}`}
                placeholder="John Doe" />
            </Field>

            {/* Candidate Email */}
            <Field label="Candidate Email" error={errors.candidateEmail?.message}>
              <input type="email"
                {...register("candidateEmail", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
                className={`form-input${errors.candidateEmail ? ' error' : ''}`}
                placeholder="john@example.com" />
            </Field>

            {/* Designation */}
            <Field label="Position / Designation" error={errors.designation?.message}>
              <input type="text" {...register("designation", { required: "Designation is required" })}
                className={`form-input${errors.designation ? ' error' : ''}`}
                placeholder="Software Engineering Intern" />
            </Field>

            {/* Department */}
            <Field label="Department">
              <input type="text" {...register("department")}
                className="form-input" placeholder="Engineering" />
            </Field>

            {/* Duration */}
            <Field label="Duration">
              <select {...register("duration")} className="form-input">
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="custom">Custom</option>
              </select>
            </Field>

            {/* Start Date */}
            <Field label="Start Date" error={errors.startDate?.message}>
              <input type="date" {...register("startDate", { required: "Start date is required" })}
                className={`form-input${errors.startDate ? ' error' : ''}`} />
            </Field>

            {/* End Date */}
            <Field label="End Date" error={errors.endDate?.message}>
              <input type="date"
                readOnly={duration !== 'custom'}
                {...register("endDate", { required: "End date is required" })}
                className={`form-input${errors.endDate ? ' error' : ''}${duration !== 'custom' ? '' : ''}`}
                style={duration !== 'custom' ? { opacity: 0.65, cursor: 'not-allowed' } : {}} />
            </Field>

            {/* Mode */}
            <Field label="Mode">
              <input type="text" {...register("mode")}
                className="form-input" placeholder="Remote" />
            </Field>

            {/* Compensation */}
            <Field label="Compensation">
              <input type="text" {...register("compensation")}
                className="form-input" placeholder="Unpaid Internship" />
            </Field>

            {/* Offer Issue Date */}
            <Field label="Offer Issue Date">
              <input type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                {...register("offerIssueDate")}
                className="form-input" />
            </Field>

            {/* Offer Valid Until */}
            <Field label="Offer Valid Until" hint="Candidates must accept before this date">
              <input type="date"
                {...register("validUntil")}
                className="form-input" />
            </Field>

          </motion.div>

          {/* Preview Modal */}
          {previewPdf && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '1.5rem', background: '#F8F9FA', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-input-border)', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-heading)' }}>PDF Preview</h3>
                <button type="button" onClick={() => setPreviewPdf(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
                  <X size={16} />
                </button>
              </div>
              <iframe src={previewPdf} style={{ width: '100%', height: '400px', border: 'none', borderRadius: '4px' }} title="PDF Preview" />
            </motion.div>
          )}

          {/* Submit */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <motion.button 
              whileTap={{ scale: 0.97 }} 
              type="button" 
              onClick={handlePreview}
              disabled={isPreviewing} 
              className="btn btn-secondary"
            >
              {isPreviewing ? (
                <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Previewing…</>
              ) : (
                <><Eye size={17} /> Preview Letter</>
              )}
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.97 }} 
              type="submit" 
              disabled={status === 'loading'} 
              className="btn btn-primary"
            >
              {status === 'loading' ? (
                <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
              ) : (
                <><Send size={17} /> Send Offer Letter</>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column' }}>
      <label className="form-label">
        {label}
        {hint && <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontWeight: 400, marginLeft: '0.4rem' }}>{hint}</span>}
      </label>
      {children}
      {error && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem', fontFamily: 'var(--font-sans)' }}>{error}</span>}
    </motion.div>
  );
}
