require('dotenv').config();
const { google } = require('googleapis');

async function setupUsersSheet() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    // 1. Add the new sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: 'Users'
            }
          }
        }]
      }
    });
    console.log('Created Users sheet.');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Users sheet already exists.');
    } else {
      throw error;
    }
  }

  // 2. Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Users!A1:G1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [['Email', 'PasswordHash', 'Name', 'Role', 'CreatedAt', 'ResetToken', 'ResetTokenExpires']]
    }
  });
  console.log('Added headers to Users sheet.');
}

setupUsersSheet().catch(console.error);
