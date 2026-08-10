const sheets = require('../config/googleSheetsClient');
const supabase = require('../config/supabaseClient');

const getAnalyticsSummary = async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(503).json({ error: 'Google Sheets not configured' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:N',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return res.status(200).json({ summary: {}, byRole: {}, byDepartment: {} });
    }

    const dataRows = rows.slice(1);
    
    // Aggregate metrics
    let total = 0;
    let accepted = 0;
    let pending = 0;
    let declined = 0;
    let sent = 0;
    let expired = 0;
    let failed = 0;
    let draft = 0;

    const byRole = {};
    const byDepartment = {};
    const byMonth = {};

    dataRows.forEach(row => {
      total++;
      const designation = row[2] || 'Unknown';
      const department = row[3] || 'N/A';
      const created_at = row[8] || new Date().toISOString();
      const status = row[9] || 'Draft';
      const validUntil = row[11];
      
      let effectiveStatus = status;
      if (validUntil && !['Accepted', 'Declined', 'Expired'].includes(status) && new Date() > new Date(validUntil)) {
        effectiveStatus = 'Expired';
      }

      if (effectiveStatus === 'Accepted') accepted++;
      else if (effectiveStatus === 'Declined') declined++;
      else if (effectiveStatus === 'Expired') expired++;
      else if (effectiveStatus === 'Sent') sent++;
      else if (effectiveStatus === 'Failed') failed++;
      else if (effectiveStatus === 'Draft') draft++;
      else pending++; // Pending Approval or Pending
      
      byRole[designation] = (byRole[designation] || 0) + 1;
      byDepartment[department] = (byDepartment[department] || 0) + 1;
      
      try {
        const d = new Date(created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
        if (!byMonth[key]) byMonth[key] = { label, count: 0 };
        byMonth[key].count++;
      } catch {}
    });

    const monthly = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, data]) => data);

    let avgTimeToAcceptDays = 0;
    if (supabase) {
      const { data: tokens, error } = await supabase
        .from('response_tokens')
        .select('offer_id, responded_at')
        .eq('response', 'accepted')
        .not('responded_at', 'is', null);
      
      if (!error && tokens && tokens.length > 0) {
        let totalDays = 0;
        let count = 0;
        tokens.forEach(token => {
          const matchRow = dataRows.find(row => row[10] === token.offer_id);
          if (matchRow && matchRow[8]) {
            const created = new Date(matchRow[8]);
            const responded = new Date(token.responded_at);
            if (!isNaN(created) && !isNaN(responded)) {
              totalDays += (responded - created) / (1000 * 60 * 60 * 24);
              count++;
            }
          }
        });
        if (count > 0) {
          avgTimeToAcceptDays = Number((totalDays / count).toFixed(1));
        }
      }
    }

    res.status(200).json({
      summary: { total, accepted, pending, declined, expired, sent, failed, draft, avgTimeToAcceptDays },
      byRole,
      byDepartment,
      monthly
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = { getAnalyticsSummary };
