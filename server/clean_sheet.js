require('dotenv').config();
const { google } = require('googleapis');

async function cleanSheet() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Clear everything from row 3 downwards in Sheet1
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A3:AD100',
    });
    
    console.log('Cleaned up corrupted rows from Google Sheet');
  } catch (error) {
    console.error('Error cleaning sheet:', error.message);
  }
}

cleanSheet();
