const cron = require('node-cron');
const sheets = require('../config/googleSheetsClient');
const supabase = require('../config/supabaseClient');
const sendOfferEmail = require('../utils/emailSender');
const { logAudit } = require('../utils/auditLogger');
const { createResponseToken } = require('../controllers/responseController');

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const REMINDER_DELAY_DAYS = 3; 

async function runReminderCheck() {
  if (!sheets || !SPREADSHEET_ID || !supabase) {
    console.warn('[ReminderJob] Sheets/Supabase not configured, skipping.');
    return;
  }

  console.log('[ReminderJob] Running reminder check at', new Date().toISOString());
  jobStatus.lastRun = new Date().toISOString();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:P',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return; // header only

    const now = new Date();
    let reminderCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const candidateName = row[0] || 'Candidate';
      const candidateEmail = row[1];
      const created_at = row[8];
      const status = row[9] || '';
      const offerId = row[10];
      const validUntil = row[11];

      // Only care about Sent offers
      if (status !== 'Sent') continue;
      
      const createdDate = new Date(created_at);
      if (isNaN(createdDate)) continue;

      const daysSinceCreated = (now - createdDate) / (1000 * 60 * 60 * 24);
      
      // If it hasn't been X days yet, skip
      if (daysSinceCreated < REMINDER_DELAY_DAYS) continue;

      // If it's already expired, skip
      if (validUntil) {
        const expiryDate = new Date(validUntil);
        if (!isNaN(expiryDate) && now > expiryDate) continue;
      }

      // Check if we already sent a reminder
      const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('offer_id', offerId)
        .eq('action', 'reminder_sent');
      
      if (error) {
        console.error(`[ReminderJob] Error checking audit logs for ${offerId}:`, error.message);
        continue;
      }

      // If we already sent a reminder, skip (only remind once)
      if (auditLogs && auditLogs.length > 0) continue;

      // Get their token so we can send them the link
      let tokenStr = null;
      const { data: tokenData } = await supabase
        .from('response_tokens')
        .select('token')
        .eq('offer_id', offerId)
        .order('expires_at', { ascending: false })
        .limit(1)
        .single();
        
      if (tokenData) {
        tokenStr = tokenData.token;
      } else {
        tokenStr = await createResponseToken(offerId, validUntil);
      }

      if (!tokenStr) continue;

      const responseLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/respond/${tokenStr}`;
      
      const emailContent = {
        subject: `Reminder: Your Offer Letter from RGTvertex is awaiting your response`,
        htmlBody: `<p>Dear <strong>${candidateName}</strong>,</p>
          <p>We hope this email finds you well.</p>
          <p>We recently sent you an offer letter to join RGTvertex, and we noticed that you haven't responded yet. We'd love to have you on the team!</p>
          <p>Please review your offer and let us know your decision.</p>
          <br><hr><br>
          <p><strong>Please click here to respond:</strong></p>
          <a href="${responseLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Respond to Offer</a>
          <p><small>Or copy and paste this link: <a href="${responseLink}">${responseLink}</a></small></p>
          <br><hr><br>
          <p>Best regards,<br/><strong>HR Team, RGTvertex</strong></p>`
      };

      try {
        await sendOfferEmail(candidateEmail, candidateName, Buffer.from([]), emailContent);
        
        await logAudit(offerId, 'System', 'reminder_sent', { reason: `Unanswered for ${REMINDER_DELAY_DAYS} days` });
        console.log(`[ReminderJob] Nudged candidate "${candidateName}" for offer ${offerId}`);
        reminderCount++;
      } catch (err) {
        console.error(`[ReminderJob] Failed to nudge ${candidateName}:`, err.message);
      }
    }

    console.log(`[ReminderJob] Done. ${reminderCount} reminder(s) sent.`);
  } catch (error) {
    console.error('[ReminderJob] Error during reminder check:', error.message);
  }
}

const jobStatus = { lastRun: null };

function startReminderJob() {
  // Run at 01:00 UTC every day
  cron.schedule('0 1 * * *', runReminderCheck, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('[ReminderJob] Scheduled daily reminder check at 01:00 UTC.');
  
  // Run once immediately on startup
  runReminderCheck().catch(err => console.error('[ReminderJob] Startup check failed:', err.message));
}

module.exports = { startReminderJob, runReminderCheck, jobStatus };
