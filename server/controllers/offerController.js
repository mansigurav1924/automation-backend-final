const generatePdf = require('../utils/pdfGenerator');
const sendOfferEmail = require('../utils/emailSender');
const supabase = require('../config/supabaseClient');
const { z } = require('zod');
const { resolveEmailContent } = require('./templateController');
const { logAudit } = require('../utils/auditLogger');
const { createResponseToken } = require('./responseController');
const { getPdfTemplateHtml } = require('./pdfTemplateController');
const { syncOfferToSheet, syncRejectionToSheet } = require('../utils/sheetsSync');

const offerSchema = z.object({
  candidateName: z.string().min(1, "Name is required").trim(),
  candidateEmail: z.string().email("Invalid email format"),
  designation: z.string().min(1, "Designation is required").trim(),
  department: z.string().optional(),
  startDate: z.string().refine(date => !isNaN(Date.parse(date)), { message: "Invalid start date" }),
  endDate: z.string().refine(date => !isNaN(Date.parse(date)), { message: "Invalid end date" }),
  mode: z.string().optional(),
  compensation: z.string().optional(),
  offerIssueDate: z.string().optional(),
  validUntil: z.string().optional(),
  pdfTemplateId: z.string().optional(),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, { message: "Start date must be before end date", path: ["endDate"] });

// ═══════════════════════════════════════════════════════════════════════
// POST /api/offers/preview
// ═══════════════════════════════════════════════════════════════════════
const previewOffer = async (req, res) => {
  try {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(', ') });
    
    const { candidateName, candidateEmail, designation, department, startDate, endDate, mode, compensation, offerIssueDate, validUntil, pdfTemplateId } = parsed.data;

    let derivedCompensation = compensation ? String(compensation).trim() : 'Unpaid Internship';
    if (!isNaN(derivedCompensation) && derivedCompensation.trim() !== '') {
      derivedCompensation = `₹${Number(derivedCompensation).toLocaleString('en-IN')} per month`;
    }

    const candidateData = {
      candidateName, candidateEmail, designation,
      department: department || 'N/A',
      startDate, endDate,
      mode: mode || 'Remote',
      compensation: derivedCompensation,
      offerIssueDate: offerIssueDate || new Date().toLocaleDateString(),
      validUntil: validUntil ? new Date(validUntil).toLocaleDateString('en-IN') : 'Not specified',
    };

    let customTemplateHtml = null;
    if (pdfTemplateId) customTemplateHtml = await getPdfTemplateHtml(pdfTemplateId);
    const pdfBuffer = await generatePdf(candidateData, { customTemplateHtml });

    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="preview.pdf"`, 'Content-Length': pdfBuffer.length });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to generate preview' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// POST /api/offers/generate
// ═══════════════════════════════════════════════════════════════════════
const generateOffer = async (req, res) => {
  try {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(', ') });

    const data = parsed.data;
    let derivedCompensation = data.compensation ? String(data.compensation).trim() : 'Unpaid Internship';
    if (!isNaN(derivedCompensation) && derivedCompensation.trim() !== '') derivedCompensation = `₹${Number(derivedCompensation).toLocaleString('en-IN')} per month`;

    const userDept = req.user?.department;
    const userRole = req.user?.role;
    const targetDept = data.department || userDept || 'N/A';

    if (userRole === 'manager' && userDept !== targetDept) {
      return res.status(403).json({ error: 'Managers can only generate offers for their own department.' });
    }

    // 1. Generate DB record as 'Pending Approval' first to get the ID
    const { data: offerRecord, error: insertError } = await supabase.from('offers').insert([{
      candidate_name: data.candidateName,
      candidate_email: data.candidateEmail,
      designation: data.designation,
      department: targetDept,
      start_date: data.startDate,
      end_date: data.endDate,
      mode: data.mode || 'Remote',
      compensation: derivedCompensation,
      offer_issue_date: data.offerIssueDate || new Date().toISOString(),
      valid_until: data.validUntil || null,
      pdf_template_id: data.pdfTemplateId || null,
      status: 'Pending Approval',
      approval_status: 'Approved',
      generated_by: req.user.userId
    }]).select().single();

    if (insertError) throw insertError;

    // 2. Generate PDF and email content
    const validUntilDisplay = offerRecord.valid_until ? new Date(offerRecord.valid_until).toLocaleDateString('en-IN') : 'Not specified';
    const candidateData = {
      candidateName: offerRecord.candidate_name, candidateEmail: offerRecord.candidate_email,
      designation: offerRecord.designation, department: offerRecord.department,
      startDate: offerRecord.start_date, endDate: offerRecord.end_date,
      mode: offerRecord.mode, compensation: offerRecord.compensation,
      validUntil: validUntilDisplay,
    };

    let customTemplateHtml = null;
    if (offerRecord.pdf_template_id) customTemplateHtml = await getPdfTemplateHtml(offerRecord.pdf_template_id);
    const pdfBuffer = await generatePdf(candidateData, { customTemplateHtml });

    const templateVars = {
      candidate_name: offerRecord.candidate_name, role: offerRecord.designation,
      joining_date: offerRecord.start_date, end_date: offerRecord.end_date,
      mode: offerRecord.mode, valid_until: validUntilDisplay,
    };

    let emailContent = await resolveEmailContent(offerRecord.id, templateVars).catch(() => null);
    const token = await createResponseToken(offerRecord.id, offerRecord.valid_until);
    if (token && emailContent) {
      const responseLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/respond/${token}`;
      emailContent.html = (emailContent.html || '') + `<br><hr><br><p><strong>Please let us know your decision:</strong></p><a href="${responseLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Respond to Offer</a>`;
    }

    let emailStatus = 'Pending';
    try {
      await sendOfferEmail(offerRecord.candidate_email, offerRecord.candidate_name, pdfBuffer, emailContent || {});
      emailStatus = 'Sent';
    } catch (e) {
      console.error('Failed to send initial email:', e);
      emailStatus = 'Failed';
    }

    // 3. Update DB to Sent
    await supabase.from('offers').update({ status: emailStatus }).eq('id', offerRecord.id);

    // 4. Async Sheets Sync
    syncOfferToSheet({
      ...offerRecord,
      manager_email: req.user.email,
      status: emailStatus,
    });

    const actorEmail = req.user?.email || 'unknown';
    await logAudit(offerRecord.id, actorEmail, 'generated_and_sent', { after: offerRecord });

    res.status(200).json({ message: 'Offer generated and sent successfully', offerId: offerRecord.id, status: emailStatus });
  } catch (error) {
    console.error('generateOffer Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/offers
// ═══════════════════════════════════════════════════════════════════════
const getOffers = async (req, res) => {
  try {
    let query = supabase.from('offers').select(`
      *,
      users!generated_by(email, name),
      rejections(*)
    `);

    if (req.user?.role === 'manager') {
      query = query.eq('department', req.user.department);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/offers/:id
// ═══════════════════════════════════════════════════════════════════════
const getOfferById = async (req, res) => {
  try {
    const { data, error } = await supabase.from('offers').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Offer not found' });
    
    if (req.user?.role === 'manager' && data.department !== req.user.department) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// POST /api/offers/:id/approve
// ═══════════════════════════════════════════════════════════════════════
const approveOffer = async (req, res) => {
  try {
    const { data: offer, error } = await supabase.from('offers').select('*').eq('id', req.params.id).single();
    if (error || !offer) return res.status(404).json({ error: 'Offer not found' });

    if (req.user?.role === 'manager' && offer.department !== req.user.department) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const validUntilDisplay = offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('en-IN') : 'Not specified';
    const candidateData = {
      candidateName: offer.candidate_name, candidateEmail: offer.candidate_email,
      designation: offer.designation, department: offer.department,
      startDate: offer.start_date, endDate: offer.end_date,
      mode: offer.mode, compensation: offer.compensation,
      validUntil: validUntilDisplay,
    };

    let customTemplateHtml = null;
    if (offer.pdf_template_id) customTemplateHtml = await getPdfTemplateHtml(offer.pdf_template_id);
    const pdfBuffer = await generatePdf(candidateData, { customTemplateHtml });

    const templateVars = {
      candidate_name: offer.candidate_name, role: offer.designation,
      joining_date: offer.start_date, end_date: offer.end_date,
      mode: offer.mode, valid_until: validUntilDisplay,
    };

    let emailContent = await resolveEmailContent(offer.id, templateVars).catch(() => null);
    const token = await createResponseToken(offer.id, offer.valid_until);
    if (token && emailContent) {
      const responseLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/respond/${token}`;
      emailContent.html = (emailContent.html || '') + `<br><hr><br><p><strong>Please let us know your decision:</strong></p><a href="${responseLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Respond to Offer</a>`;
    }

    let emailStatus = 'Pending';
    try {
      await sendOfferEmail(offer.candidate_email, offer.candidate_name, pdfBuffer, emailContent || {});
      emailStatus = 'Sent';
    } catch (e) {
      emailStatus = 'Failed';
    }

    await supabase.from('offers').update({ status: emailStatus, approval_status: 'Approved' }).eq('id', offer.id);
    
    syncOfferToSheet({ ...offer, status: emailStatus, manager_email: req.user.email });
    await logAudit(offer.id, req.user.email, 'approved', { resultStatus: emailStatus });

    res.status(200).json({ message: 'Offer approved and sent', status: emailStatus });
  } catch (error) {
    console.error('approveOffer Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// POST /api/offers/:id/reject (Internal reject logic for an offer draft)
// ═══════════════════════════════════════════════════════════════════════
const rejectOffer = async (req, res) => {
  try {
    const { data: offer, error } = await supabase.from('offers').select('*').eq('id', req.params.id).single();
    if (error || !offer) return res.status(404).json({ error: 'Offer not found' });

    if (req.user?.role === 'manager' && offer.department !== req.user.department) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await supabase.from('offers').update({ status: 'Rejected', approval_status: 'Rejected' }).eq('id', offer.id);
    syncOfferToSheet({ ...offer, status: 'Rejected', manager_email: req.user.email });

    await logAudit(offer.id, req.user.email, 'rejected_draft');

    res.status(200).json({ message: 'Offer draft rejected', approval_status: 'Rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject offer' });
  }
};

const resendOffer = async (req, res) => {
  try {
    const { data: offer, error } = await supabase.from('offers').select('*').eq('id', req.params.id).single();
    if (error || !offer) return res.status(404).json({ error: 'Offer not found' });
    if (req.user?.role === 'manager' && offer.department !== req.user.department) return res.status(403).json({ error: 'Access denied' });

    const validUntilDisplay = offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('en-IN') : 'Not specified';
    const candidateData = {
      candidateName: offer.candidate_name, candidateEmail: offer.candidate_email,
      designation: offer.designation, department: offer.department,
      startDate: offer.start_date, endDate: offer.end_date,
      mode: offer.mode, compensation: offer.compensation,
      validUntil: validUntilDisplay,
    };

    let customTemplateHtml = null;
    if (offer.pdf_template_id) customTemplateHtml = await getPdfTemplateHtml(offer.pdf_template_id);
    const pdfBuffer = await generatePdf(candidateData, { customTemplateHtml });

    const templateVars = {
      candidate_name: offer.candidate_name, role: offer.designation,
      joining_date: offer.start_date, end_date: offer.end_date,
      mode: offer.mode, valid_until: validUntilDisplay,
    };

    let emailContent = await resolveEmailContent(offer.id, templateVars).catch(() => null);
    const token = await createResponseToken(offer.id, offer.valid_until);
    if (token && emailContent) {
      const responseLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/respond/${token}`;
      emailContent.html = (emailContent.html || '') + `<br><hr><br><p><strong>Please let us know your decision:</strong></p><a href="${responseLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Respond to Offer</a>`;
    }

    let emailStatus = 'Failed';
    try {
      await sendOfferEmail(offer.candidate_email, offer.candidate_name, pdfBuffer, emailContent || {});
      emailStatus = 'Sent';
    } catch (e) {
      console.error(e);
    }

    await supabase.from('offers').update({ status: emailStatus }).eq('id', offer.id);
    syncOfferToSheet({ ...offer, status: emailStatus, manager_email: req.user.email });
    await logAudit(offer.id, req.user.email, 'resent');

    res.status(200).json({ message: 'Offer resent', status: emailStatus });
  } catch (error) {
    console.error('resendOffer Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

const updateOffer = async (req, res) => {
  try {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(', ') });

    const { data: offer, error } = await supabase.from('offers').select('*').eq('id', req.params.id).single();
    if (error || !offer) return res.status(404).json({ error: 'Offer not found' });
    if (req.user?.role === 'manager' && offer.department !== req.user.department) return res.status(403).json({ error: 'Access denied' });

    const data = parsed.data;
    let derivedCompensation = data.compensation ? String(data.compensation).trim() : 'Unpaid Internship';
    if (!isNaN(derivedCompensation) && derivedCompensation.trim() !== '') derivedCompensation = `₹${Number(derivedCompensation).toLocaleString('en-IN')} per month`;

    const { data: updatedOffer, error: updateError } = await supabase.from('offers').update({
      candidate_name: data.candidateName,
      candidate_email: data.candidateEmail,
      designation: data.designation,
      start_date: data.startDate,
      end_date: data.endDate,
      mode: data.mode || 'Remote',
      compensation: derivedCompensation,
      valid_until: data.validUntil || null,
      pdf_template_id: data.pdfTemplateId || null,
    }).eq('id', offer.id).select().single();

    if (updateError) throw updateError;
    
    syncOfferToSheet({ ...updatedOffer, manager_email: req.user.email });
    await logAudit(offer.id, req.user.email, 'updated', { before: offer, after: updatedOffer });

    res.status(200).json({ message: 'Offer updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const downloadOfferPdf = async (req, res) => {
  try {
    const { data: offer, error } = await supabase.from('offers').select('*').eq('id', req.params.id).single();
    if (error || !offer) return res.status(404).json({ error: 'Offer not found' });
    if (req.user?.role === 'manager' && offer.department !== req.user.department) return res.status(403).json({ error: 'Access denied' });

    const candidateData = {
      candidateName: offer.candidate_name, candidateEmail: offer.candidate_email,
      designation: offer.designation, department: offer.department,
      startDate: offer.start_date, endDate: offer.end_date, mode: offer.mode,
      compensation: offer.compensation, offerIssueDate: new Date(offer.offer_issue_date).toLocaleDateString(),
      validUntil: offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('en-IN') : 'Not specified',
    };

    let customTemplateHtml = null;
    if (offer.pdf_template_id) customTemplateHtml = await getPdfTemplateHtml(offer.pdf_template_id);
    const pdfBuffer = await generatePdf(candidateData, { customTemplateHtml });

    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="Offer_${req.params.id}.pdf"`, 'Content-Length': pdfBuffer.length });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

module.exports = { generateOffer, previewOffer, getOffers, getOfferById, resendOffer, updateOffer, approveOffer, rejectOffer, downloadOfferPdf };
