const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

let sheets = null;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    let authOptions = { scopes: ['https://www.googleapis.com/auth/spreadsheets'] };
    
    // Check if the env variable contains the raw JSON string (starts with '{')
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS.trim().startsWith('{')) {
      try {
        authOptions.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      } catch (parseError) {
        console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS as JSON.', parseError);
      }
    } else {
      // Otherwise, assume it's a file path
      authOptions.keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }

    const auth = new google.auth.GoogleAuth(authOptions);
    sheets = google.sheets({ version: 'v4', auth });
  } else {
    console.warn('Google Sheets credentials not provided in .env');
  }
} catch (error) {
  console.warn('Google Sheets client could not be initialized.', error.message);
}

module.exports = sheets;
