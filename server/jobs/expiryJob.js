const cron = require('node-cron');
const supabase = require('../config/supabaseClient');

// Terminal statuses that should never be auto-overwritten
const TERMINAL_STATUSES = ['Accepted', 'Rejected', 'Expired', 'Declined'];

async function runExpiryCheck() {
  if (!supabase) {
    console.warn('[ExpiryJob] Supabase not configured, skipping.');
    return;
  }

  console.log('[ExpiryJob] Running expiry check at', new Date().toISOString());
  jobStatus.lastRun = new Date().toISOString();

  try {
    const { data: rows, error } = await supabase
      .from('offers')
      .select('*');

    if (error) throw error;
    if (!rows || rows.length === 0) return;

    const now = new Date();
    let expiredCount = 0;

    for (const row of rows) {
      // Skip if no expiry date set, or already in terminal status
      if (!row.valid_until || TERMINAL_STATUSES.includes(row.status)) continue;

      const expiryDate = new Date(row.valid_until);
      if (isNaN(expiryDate)) continue; // bad date format, skip

      if (now > expiryDate) {
        // Flip status to Expired
        const { error: updateError } = await supabase
          .from('offers')
          .update({ status: 'Expired' })
          .eq('id', row.id);

        if (updateError) {
          console.error(`[ExpiryJob] Failed to update offer ${row.id}:`, updateError.message);
          continue;
        }

        const candidateName = row.candidate_name || 'Unknown';
        console.log(`[ExpiryJob] Marked offer for "${candidateName}" (ID ${row.id}) as Expired.`);
        expiredCount++;
      }
    }

    console.log(`[ExpiryJob] Done. ${expiredCount} offer(s) expired.`);
  } catch (error) {
    console.error('[ExpiryJob] Error during expiry check:', error.message);
  }
}

const jobStatus = { lastRun: null };

function startExpiryJob() {
  // Run at 00:05 UTC every day
  cron.schedule('5 0 * * *', runExpiryCheck, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('[ExpiryJob] Scheduled daily expiry check at 00:05 UTC.');

  // Run once immediately on startup to catch any already-expired offers
  runExpiryCheck().catch(err => console.error('[ExpiryJob] Startup check failed:', err.message));
}

module.exports = { startExpiryJob, runExpiryCheck, jobStatus };
