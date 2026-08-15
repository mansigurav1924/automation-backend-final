require('dotenv').config();
const { google } = require('googleapis');
const bcrypt = require('bcryptjs');

async function resetUsers() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    // Clear all existing data in Users sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Users!A:H',
    });
    console.log('Cleared Users sheet.');

    // Add headers back
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Users!A1:H1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [['Email', 'PasswordHash', 'Name', 'Role', 'CreatedAt', 'ResetToken', 'ResetTokenExpires', 'Department']]
      }
    });
    console.log('Added headers.');

    // Create admin account
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Users!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          'admin@admin.com',
          passwordHash,
          'System Admin',
          'admin',
          new Date().toISOString(),
          '',
          '',
          ''
        ]]
      }
    });
    console.log('Created admin account: email=admin@admin.com, password=admin123');

  } catch (error) {
    console.error('Error:', error);
  }
}

resetUsers();
