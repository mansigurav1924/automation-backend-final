const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

let sheets = null;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheets = google.sheets({ version: 'v4', auth });
  } else {
    console.warn('Google Sheets credentials not provided in .env');
  }
} catch (error) {
  console.warn('Google Sheets client could not be initialized.', error.message);
}

module.exports = sheets;
