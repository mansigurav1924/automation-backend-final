const supabase = require('../config/supabaseClient');

// ── Variable interpolation: replaces {{key}} with values ─────────────
function interpolate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

// ── GET /api/templates ───────────────────────────────────────────────
const listTemplates = async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase
    .from('email_templates')
    .select('id, name, subject, is_default, created_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// ── GET /api/templates/default ───────────────────────────────────────
const getDefaultTemplate = async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('is_default', true)
    .single();
  if (error) return res.status(404).json({ error: 'No default template found' });
  res.json(data);
};

// ── GET /api/templates/:id ───────────────────────────────────────────
const getTemplate = async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Template not found' });
  res.json(data);
};

// ── POST /api/templates ──────────────────────────────────────────────
const createTemplate = async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { name, subject, body_html, is_default } = req.body;
  if (!name || !subject || !body_html) {
    return res.status(400).json({ error: 'name, subject, and body_html are required' });
  }

  // If setting as default, unset any existing default first
  if (is_default) {
    await supabase.from('email_templates').update({ is_default: false }).eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('email_templates')
    .insert({ name, subject, body_html, is_default: !!is_default })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

// ── PUT /api/templates/:id ───────────────────────────────────────────
const updateTemplate = async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { name, subject, body_html, is_default } = req.body;

  if (is_default) {
    await supabase.from('email_templates').update({ is_default: false }).eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('email_templates')
    .update({ name, subject, body_html, is_default: !!is_default, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// ── DELETE /api/templates/:id ────────────────────────────────────────
const deleteTemplate = async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { error } = await supabase.from('email_templates').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
};

// ── GET/PUT /api/templates/overrides/:offerId ────────────────────────
const getOfferOverride = async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data } = await supabase
    .from('offer_email_overrides')
    .select('*')
    .eq('offer_id', req.params.offerId)
    .single();
  res.json(data || null);
};

const upsertOfferOverride = async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { subject, body_html } = req.body;
  const { data, error } = await supabase
    .from('offer_email_overrides')
    .upsert({ offer_id: req.params.offerId, subject, body_html, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// ── Utility: build email body for sending ────────────────────────────
// Call this from emailSender before sending to get rendered subject+html
async function resolveEmailContent(offerId, templateVars) {
  if (!supabase) return null;  // fallback to plain text

  // Check for per-offer override first
  const { data: override } = await supabase
    .from('offer_email_overrides')
    .select('*')
    .eq('offer_id', offerId)
    .single();

  if (override?.body_html) {
    return {
      subject: interpolate(override.subject || 'Your Offer Letter', templateVars),
      html: interpolate(override.body_html, templateVars),
    };
  }

  // Fall back to default template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('is_default', true)
    .single();

  if (template?.body_html) {
    return {
      subject: interpolate(template.subject, templateVars),
      html: interpolate(template.body_html, templateVars),
    };
  }

  return null; // use legacy plain text
}

module.exports = {
  listTemplates,
  getDefaultTemplate,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getOfferOverride,
  upsertOfferOverride,
  resolveEmailContent,
};
