const cron = require('node-cron');
const sheets = require('../config/googleSheetsClient');

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Terminal statuses that should never be auto-overwritten
const TERMINAL_STATUSES = ['Accepted', 'Declined', 'Expired'];

async function runExpiryCheck() {
  if (!sheets || !SPREADSHEET_ID) {
    console.warn('[ExpiryJob] Google Sheets not configured, skipping.');
    return;
  }

  console.log('[ExpiryJob] Running expiry check at', new Date().toISOString());
  jobStatus.lastRun = new Date().toISOString();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return; // header only

    const now = new Date();
    let expiredCount = 0;

    // Process data rows (skip header at index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const sheetRow = i + 1; // Google Sheets is 1-indexed

      const emailStatus = row[9] || '';
      const validUntil  = row[11] || '';

      // Skip if no expiry date set, or already in terminal status
      if (!validUntil || TERMINAL_STATUSES.includes(emailStatus)) continue;

      const expiryDate = new Date(validUntil);
      if (isNaN(expiryDate)) continue; // bad date format, skip

      if (now > expiryDate) {
        // Flip status to Expired in column J
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Sheet1!J${sheetRow}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [['Expired']] }
        });

        const candidateName = row[0] || 'Unknown';
        console.log(`[ExpiryJob] Marked offer for "${candidateName}" (row ${sheetRow}) as Expired.`);
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
  // Run at 00:05 UTC every day (give Sheets API a moment to be ready)
  cron.schedule('5 0 * * *', runExpiryCheck, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('[ExpiryJob] Scheduled daily expiry check at 00:05 UTC.');

  // Run once immediately on startup to catch any already-expired offers
  runExpiryCheck().catch(err => console.error('[ExpiryJob] Startup check failed:', err.message));
}

module.exports = { startExpiryJob, runExpiryCheck, jobStatus };
