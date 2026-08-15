require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sheets = require('../config/googleSheetsClient');

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function run() {
  console.log('Starting backfill for missing Offer IDs...');

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:K',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      console.log('No data found to backfill.');
      return;
    }

    let updatedCount = 0;
    
    // Start from row index 1 (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const sheetRow = i + 1; // Google Sheets is 1-indexed
      
      // Column K (index 10) is the Offer ID
      if (!row[10] || row[10].trim() === '') {
        const newId = makeId();
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: `Sheet1!K${sheetRow}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [[newId]] }
        });
        
        console.log(`Updated Row ${sheetRow} for candidate ${row[0]} with ID ${newId}`);
        updatedCount++;
      }
    }

    console.log(`\nBackfill complete! Generated IDs for ${updatedCount} rows.`);
    
  } catch (err) {
    console.error('Error during backfill:', err);
  }
}

run();
