require('dotenv').config();
const { google } = require('googleapis');

async function testSheetsAuth() {
  try {
    console.log('Testing Google Sheets Authentication...');
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Attempt to read the spreadsheet
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
    });
    
    console.log('Authentication and Read successful!', response.data.properties.title);
  } catch (error) {
    console.error('API Error:', error.message);
  }
}

testSheetsAuth();
