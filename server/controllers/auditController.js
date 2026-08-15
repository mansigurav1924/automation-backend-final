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

const getRecentAuditLogs = async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Failed to get recent audit logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllAuditLogs = async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    let { page = 1, limit = 50, actor, action } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (actor) query = query.ilike('actor_email', `%${actor}%`);
    if (action) query = query.eq('action', action);

    query = query.order('created_at', { ascending: false }).range(start, end);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('Failed to get all audit logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAuditLogs, getRecentAuditLogs, getAllAuditLogs };
