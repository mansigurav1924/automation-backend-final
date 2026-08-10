const supabase = require('../config/supabaseClient');

/**
 * Log an action to the audit_logs table
 * @param {string} offerId     - The ID of the offer being modified
 * @param {string} actorEmail  - The email of the user performing the action
 * @param {string} action      - A short string describing the action (e.g. 'generated', 'resent', 'approved')
 * @param {object} [diff]      - Optional JSON object detailing the state change { before: {}, after: {} }
 */
async function logAudit(offerId, actorEmail, action, diff = null) {
  if (!supabase) {
    console.warn('[AuditLogger] Supabase not configured. Skipping audit log for:', action);
    return;
  }
  
  if (!offerId || !actorEmail || !action) {
    console.error('[AuditLogger] Missing required fields for audit log');
    return;
  }

  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        offer_id: offerId,
        actor_email: actorEmail,
        action,
        diff
      });
      
    if (error) {
      console.error('[AuditLogger] Failed to insert audit log:', error.message);
    }
  } catch (err) {
    console.error('[AuditLogger] Unexpected error:', err.message);
  }
}

module.exports = { logAudit };
