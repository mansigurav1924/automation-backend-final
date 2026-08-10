const supabase = require('../config/supabaseClient');

const getPdfTemplates = async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  try {
    const { data, error } = await supabase.from('pdf_templates').select('id, name, employment_type, is_default');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPdfTemplateHtml = async (id) => {
  if (!supabase) return null;
  const { data } = await supabase.from('pdf_templates').select('html_content').eq('id', id).single();
  return data ? data.html_content : null;
};

module.exports = { getPdfTemplates, getPdfTemplateHtml };
