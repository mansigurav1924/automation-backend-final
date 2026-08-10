const sheets = require('../config/googleSheetsClient');
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

const getAdminUsers = async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Users!A:H',
    });
    const rows = response.data.values || [];
    if (rows.length <= 1) return res.status(200).json([]);
    
    const users = rows.slice(1).map(row => ({
      email: row[0],
      name: row[2],
      role: row[3],
      createdAt: row[4],
      department: row[7] || ''
    }));
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getAdminOffers = async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:P',
    });
    const rows = response.data.values || [];
    if (rows.length <= 1) return res.status(200).json([]);
    
    const { rowToOffer } = require('./offerController');
    const data = rows.slice(1)
      .map((row, i) => rowToOffer(row, i + 2))
      .filter(o => o.candidate_name !== '');
      
    res.status(200).json(data.reverse());
  } catch (error) {
    console.error('Error fetching admin offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
};

module.exports = {
  getAdminUsers,
  getAdminOffers
};
