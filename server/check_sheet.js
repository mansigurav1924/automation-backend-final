require('dotenv').config();
const { google } = require('googleapis');

async function checkSheet() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:P',
    });
    
    console.log(JSON.stringify(response.data.values || [], null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSheet();
