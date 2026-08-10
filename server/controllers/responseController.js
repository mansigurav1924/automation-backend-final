const crypto = require('crypto');
const supabase = require('../config/supabaseClient');
const sheets = require('../config/googleSheetsClient');
const { logAudit } = require('../utils/auditLogger');

/**
 * Creates a unique response token for an offer and stores it in Supabase
 * @param {string} offerId 
 * @param {string} validUntil - ISO date string
 * @returns {string} - The generated token
 */
const createResponseToken = async (offerId, validUntil) => {
  if (!supabase) return null;
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = validUntil ? new Date(validUntil).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default 7 days
  
  const { error } = await supabase
    .from('response_tokens')
    .insert({
      token,
      offer_id: offerId,
      expires_at: expiresAt
    });
    
  if (error) {
    console.error('Failed to create response token:', error);
    return null;
  }
  return token;
};

// GET /api/respond/:token
const getOfferByToken = async (req, res) => {
  const { token } = req.params;
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  try {
    const { data: tokenData, error } = await supabase
      .from('response_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !tokenData) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).json({ error: 'This offer has expired.' });
    }

    // Now fetch the offer details from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:M',
    });
    
    const rows = response.data.values || [];
    const matchRow = rows.find(r => r[10] === tokenData.offer_id);
    
    if (!matchRow) return res.status(404).json({ error: 'Offer not found' });
    
    const offerDetails = {
      id: matchRow[10],
      candidate_name: matchRow[0],
      designation: matchRow[2],
      department: matchRow[3],
      start_date: matchRow[4],
      end_date: matchRow[5],
      mode: matchRow[6],
      compensation: matchRow[7],
      valid_until: matchRow[11],
      status: matchRow[9],
      responded_at: tokenData.responded_at,
      response: tokenData.response
    };

    res.json({ token: tokenData, offer: offerDetails });
  } catch (err) {
    console.error('Error fetching token:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/respond/:token
const submitResponse = async (req, res) => {
  const { token } = req.params;
  const { response: candidateResponse } = req.body; // 'accepted' | 'declined'

  if (!['accepted', 'declined'].includes(candidateResponse)) {
    return res.status(400).json({ error: 'Invalid response' });
  }

  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  try {
    // 1. Verify token
    const { data: tokenData, error } = await supabase
      .from('response_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !tokenData) return res.status(404).json({ error: 'Invalid link' });
    if (tokenData.response) return res.status(400).json({ error: 'You have already responded to this offer.' });
    if (new Date() > new Date(tokenData.expires_at)) return res.status(400).json({ error: 'This offer has expired.' });

    // 2. Update token record
    const { error: updateError } = await supabase
      .from('response_tokens')
      .update({
        response: candidateResponse,
        responded_at: new Date().toISOString()
      })
      .eq('token', token);

    if (updateError) throw updateError;

    // 3. Update Google Sheets status
    const sheetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:M',
    });
    
    const rows = sheetResponse.data.values || [];
    const matchRowIndex = rows.findIndex(r => r[10] === tokenData.offer_id);
    
    if (matchRowIndex !== -1) {
      const sheetRowIndex = matchRowIndex + 1;
      const newStatus = candidateResponse === 'accepted' ? 'Accepted' : 'Declined';
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Sheet1!J${sheetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[newStatus]] }
      });
    }

    // 4. Log Audit
    await logAudit(tokenData.offer_id, 'Candidate', `candidate_${candidateResponse}`);

    // 5. WebSocket broadcast
    if (typeof global.broadcastResponse === 'function') {
      global.broadcastResponse({
        type: 'OFFER_RESPONSE',
        offerId: tokenData.offer_id,
        response: candidateResponse,
      });
    }

    res.json({ message: 'Response recorded successfully', response: candidateResponse });
  } catch (err) {
    console.error('Error submitting response:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createResponseToken, getOfferByToken, submitResponse };
