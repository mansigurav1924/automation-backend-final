const supabase = require('../config/supabaseClient');

// GET /api/audit/:offerId
const getAuditLogs = async (req, res) => {
  const { offerId } = req.params;

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Failed to get audit logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAuditLogs };
