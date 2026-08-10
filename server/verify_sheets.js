require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');

async function verifySheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID
    });
    
    const sheetTitles = response.data.sheets.map(s => s.properties.title);
    fs.writeFileSync('sheets_metadata.json', JSON.stringify({
      success: true,
      titles: sheetTitles
    }, null, 2));
    
  } catch (error) {
    fs.writeFileSync('sheets_metadata.json', JSON.stringify({
      success: false,
      error: error.message
    }, null, 2));
  }
}

verifySheets();
