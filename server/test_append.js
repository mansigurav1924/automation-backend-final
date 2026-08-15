require('dotenv').config();
const { google } = require('googleapis');

async function testAppend() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log("Appending to:", process.env.GOOGLE_SHEET_ID);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:A',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          'Test Candidate', 'test@example.com', 'Tester', 'Engineering',
          '2026-09-01', '2026-12-01', 'Remote', 'Paid',
          new Date().toISOString(), 'Draft', 'testid123',
          '2026-08-20', 'Approved', '',
          'admin@admin.com', ''
        ]]
      }
    });
    
    console.log('Append response:', response.data);
  } catch (error) {
    console.error('Append Error:', error.message);
  }
}

testAppend();
