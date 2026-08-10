const crypto = require('crypto');
const supabase = require('../config/supabaseClient');
const { logAudit } = require('../utils/auditLogger');
const { syncOfferToSheet, syncRejectionToSheet } = require('../utils/sheetsSync');

/**
 * Creates a unique response token for an offer and stores it in Supabase
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
    const { data: tokenData, error: tokenError } = await supabase
      .from('response_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).json({ error: 'This offer has expired.' });
    }

    // Now fetch the offer details from Supabase
    const { data: offerData, error: offerError } = await supabase
      .from('offers')
      .select('*, users!generated_by(email)')
      .eq('id', tokenData.offer_id)
      .single();
    
    if (offerError || !offerData) return res.status(404).json({ error: 'Offer not found' });
    
    const offerDetails = {
      id: offerData.id,
      candidate_name: offerData.candidate_name,
      designation: offerData.designation,
      department: offerData.department,
      start_date: offerData.start_date,
      end_date: offerData.end_date,
      mode: offerData.mode,
      compensation: offerData.compensation,
      valid_until: offerData.valid_until,
      status: offerData.status,
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
    const { data: tokenData, error: tokenError } = await supabase
      .from('response_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) return res.status(404).json({ error: 'Invalid link' });
    if (tokenData.response) return res.status(400).json({ error: 'You have already responded to this offer.' });
    if (new Date() > new Date(tokenData.expires_at)) return res.status(400).json({ error: 'This offer has expired.' });

    // 2. Fetch Offer to update
    const { data: offerData, error: offerFetchError } = await supabase
      .from('offers')
      .select('*, users!generated_by(email)')
      .eq('id', tokenData.offer_id)
      .single();
      
    if (offerFetchError || !offerData) throw offerFetchError || new Error('Offer not found');

    const newStatus = candidateResponse === 'accepted' ? 'Accepted' : 'Rejected';

    // 3. Update token record
    const { error: updateError } = await supabase
      .from('response_tokens')
      .update({
        response: candidateResponse,
        responded_at: new Date().toISOString()
      })
      .eq('token', token);

    if (updateError) throw updateError;

    // 4. Update Offer Status in Supabase
    await supabase.from('offers').update({ status: newStatus }).eq('id', offerData.id);

    // 5. Handle Rejection specific logic
    if (newStatus === 'Rejected') {
      const rejectedAt = new Date().toISOString();
      await supabase.from('rejections').insert([{
        offer_id: offerData.id,
        candidate_name: offerData.candidate_name,
        candidate_email: offerData.candidate_email,
        reason: req.body.reason || null,
        rejected_at: rejectedAt
      }]);

      syncRejectionToSheet({
        candidate_name: offerData.candidate_name,
        candidate_email: offerData.candidate_email,
        department: offerData.department,
        manager_email: offerData.users?.email,
        rejected_at: rejectedAt
      });
    }

    // Update Sheets for Offer status change
    syncOfferToSheet({
      ...offerData,
      status: newStatus,
      manager_email: offerData.users?.email
    });

    // 6. Log Audit
    await logAudit(tokenData.offer_id, 'Candidate', `candidate_${candidateResponse}`);

    // 7. WebSocket broadcast
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
