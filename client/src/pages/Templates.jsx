import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, Mail, Star, StarOff, Loader2, ChevronDown } from 'lucide-react';

const VARS = ['{{candidate_name}}', '{{role}}', '{{joining_date}}', '{{end_date}}', '{{valid_until}}', '{{mode}}'];

const BLANK = { name: '', subject: '', body_html: '', is_default: false };

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null);   // null = list view, object = edit view
  const [saving, setSaving]       = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch { setTemplates([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleNew = () => setEditing({ ...BLANK });

  const handleEdit = async (t) => {
    const res = await api.get(`/templates/${t.id}`);
    setEditing(res.data);
    setShowPreview(false);
  };

  const handleSave = async () => {
    if (!editing.name || !editing.subject || !editing.body_html) {
      toast.error('Name, subject and body are required.');
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        const res = await api.put(`/templates/${editing.id}`, editing);
        setTemplates(prev => prev.map(t => t.id === editing.id ? { ...t, ...res.data } : t));
        toast.success('Template saved!');
      } else {
        const res = await api.post('/templates', editing);
        setTemplates(prev => [res.data, ...prev]);
        toast.success('Template created!');
      }
      setEditing(null);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (editing?.id === id) setEditing(null);
      toast.success('Template deleted.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleSetDefault = async (t) => {
    try {
      await api.put(`/templates/${t.id}`, { ...t, is_default: true });
      await fetchTemplates();
      toast.success(`"${t.name}" is now the default template.`);
    } catch {
      toast.error('Failed to update.');
    }
  };

  const insertVar = (v) => {
    setEditing(prev => ({ ...prev, body_html: (prev.body_html || '') + v }));
  };

  const handlePreview = () => {
    // Simple preview substitution
    const sample = {
      '{{candidate_name}}': 'Arjun Sharma',
      '{{role}}': 'Software Engineering Intern',
      '{{joining_date}}': '01 September 2025',
      '{{end_date}}': '28 February 2026',
      '{{valid_until}}': '25 August 2025',
      '{{mode}}': 'Remote',
    };
    let html = editing?.body_html || '';
    Object.entries(sample).forEach(([k, v]) => { html = html.replaceAll(k, v); });
    setPreviewHtml(html);
    setShowPreview(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      style={{ maxWidth: 900, margin: '0 auto' }}>

      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-heading)', margin: 0, letterSpacing: '-0.025em' }}>
            Email Templates
          </h1>
          <p style={{ color: 'var(--color-body)', margin: '0.3rem 0 0', fontSize: '0.875rem' }}>
            Manage reusable email templates with variable interpolation.
          </p>
        </div>
        {!editing && (
          <button onClick={handleNew} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> New Template
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── Edit / Create Form ─── */}
        {editing ? (
          <motion.div key="editor" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="form-label">Template Name</label>
                  <input className="form-input" value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Default Internship Offer" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label className="form-label">Email Subject</label>
                  <input className="form-input" value={editing.subject} onChange={e => setEditing(p => ({ ...p, subject: e.target.value }))} placeholder="Your Offer Letter from RGTvertex" />
                </div>
              </div>

              {/* Variable chips */}
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-body)', marginRight: '0.5rem' }}>Insert variable:</span>
                {VARS.map(v => (
                  <button key={v} type="button" onClick={() => insertVar(v)}
                    style={{ marginRight: 4, marginBottom: 4, padding: '0.2rem 0.55rem', borderRadius: 6, background: '#EDE9FF', border: 'none', color: 'var(--color-primary)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                    {v}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                <label className="form-label">Email Body HTML</label>
                <textarea
                  className="form-input"
                  rows={10}
                  value={editing.body_html}
                  onChange={e => setEditing(p => ({ ...p, body_html: e.target.value }))}
                  placeholder="<p>Dear {{candidate_name}}, ...</p>"
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.6 }}
                />
              </div>

              {/* Live HTML preview */}
              <AnimatePresence>
                {showPreview && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ border: '1px solid var(--color-input-border)', borderRadius: 12, padding: '1.25rem', background: '#fff' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>Preview (sample data)</p>
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#333' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-heading)', fontWeight: 600 }}>
                <input type="checkbox" checked={editing.is_default} onChange={e => setEditing(p => ({ ...p, is_default: e.target.checked }))} />
                Set as default template
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditing(null); setShowPreview(false); }} className="btn btn-secondary">Cancel</button>
                <button onClick={handlePreview} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={15} /> {showPreview ? 'Refresh Preview' : 'Preview'}
                </button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                  {saving ? 'Saving…' : 'Save Template'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── Template List ─── */
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)}
              </div>
            ) : templates.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <Mail size={40} style={{ color: 'var(--color-muted)', marginBottom: '1rem' }} strokeWidth={1.5} />
                <h3 style={{ fontWeight: 700, color: 'var(--color-heading)', margin: '0 0 0.5rem' }}>No templates yet</h3>
                <p style={{ color: 'var(--color-body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Create your first email template to customize offer emails.
                </p>
                <button onClick={handleNew} className="btn btn-primary">
                  <Plus size={16} /> Create Template
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {templates.map(t => (
                  <motion.div key={t.id} layout
                    style={{ background: '#fff', borderRadius: 16, border: `1px solid ${t.is_default ? 'var(--color-primary)' : '#F1F1F8'}`, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 10px rgba(27,20,69,0.05)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-heading)', fontSize: '0.95rem' }}>{t.name}</span>
                        {t.is_default && (
                          <span style={{ background: '#EDE9FF', color: 'var(--color-primary)', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 6, letterSpacing: '0.06em' }}>DEFAULT</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>{t.subject}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!t.is_default && (
                        <button onClick={() => handleSetDefault(t)} title="Set as default"
                          style={{ background: '#FEF3C7', border: 'none', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer' }}>
                          <Star size={14} color="#D97706" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(t)}
                        style={{ background: '#EDE9FF', border: 'none', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(t.id)}
                        style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer' }}>
                        <Trash2 size={14} color="#DC2626" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
