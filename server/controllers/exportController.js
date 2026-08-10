const { unparse } = require('papaparse');
const sheets = require('../config/googleSheetsClient');

// Reuse rowToOffer logic — inline here to avoid circular dependency
function rowToOfferSimple(row, sheetRowIndex) {
  const validUntil   = row[11] || null;
  const status       = row[9]  || 'Pending';
  const terminalStatuses = ['Accepted', 'Declined', 'Expired'];
  const effectiveStatus = (
    validUntil && !terminalStatuses.includes(status) && new Date() > new Date(validUntil)
  ) ? 'Expired' : status;

  return {
    id:              row[10] || String(sheetRowIndex),
    candidate_name:  row[0]  || '',
    candidate_email: row[1]  || '',
    designation:     row[2]  || '',
    department:      row[3]  || '',
    start_date:      row[4]  || '',
    end_date:        row[5]  || '',
    mode:            row[6]  || '',
    compensation:    row[7]  || '',
    created_at:      row[8]  || '',
    status:          effectiveStatus,
    valid_until:     validUntil || '',
  };
}

// GET /api/offers/export?status=Sent&dept=Engineering&from=2025-01-01&to=2025-12-31
const exportOffers = async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(503).json({ error: 'Google Sheets not configured' });
    }

    const { status, dept, from, to } = req.query;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:L',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return res.status(200).send('Candidate Name,Email,Designation,Department,Start Date,End Date,Mode,Compensation,Status,Created At,Valid Until\n');
    }

    let offers = rows.slice(1)
      .map((row, i) => rowToOfferSimple(row, i + 2))
      .filter(o => o.candidate_name !== '');

    // Apply filters
    if (status && status !== 'All') {
      offers = offers.filter(o => o.status === status);
    }
    if (dept) {
      offers = offers.filter(o =>
        o.department.toLowerCase().includes(dept.toLowerCase())
      );
    }
    if (from) {
      const fromDate = new Date(from);
      offers = offers.filter(o => !o.created_at || new Date(o.created_at) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999); // end of day
      offers = offers.filter(o => !o.created_at || new Date(o.created_at) <= toDate);
    }

    // Build CSV rows
    const csvData = offers.map(o => ({
      'Candidate Name': o.candidate_name,
      'Email':          o.candidate_email,
      'Designation':    o.designation,
      'Department':     o.department,
      'Start Date':     o.start_date,
      'End Date':       o.end_date,
      'Mode':           o.mode,
      'Compensation':   o.compensation,
      'Status':         o.status,
      'Created At':     o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '',
      'Valid Until':    o.valid_until ? new Date(o.valid_until).toLocaleDateString('en-IN') : 'Not set',
    }));

    const csv = unparse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="offers-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export offers' });
  }
};

module.exports = { exportOffers };
