const generatePdf = require('../utils/pdfGenerator');
const sendOfferEmail = require('../utils/emailSender');
const sheets = require('../config/googleSheetsClient');
const { z } = require('zod');
const { resolveEmailContent } = require('./templateController');
const { logAudit } = require('../utils/auditLogger');
const { createResponseToken } = require('./responseController');

const { getPdfTemplateHtml } = require('./pdfTemplateController');

// ── Validation Schemas ───────────────────────────────────────────────
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
  validUntil: z.string().optional(),  // Offer expiry date (Column L)
  pdfTemplateId: z.string().optional(),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: "Start date must be before end date",
  path: ["endDate"]
});

// ── Helper: generate a short unique ID ───────────────────────────────
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Helper: fetch all sheet rows (including header) ──────────────────
async function getAllRows() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:P',   // Extended to include Column P
  });
  return response.data.values || [];
}

// ── Helper: map a data row-array → offer object ──────────────────────
// Columns: A=candidateName B=candidateEmail C=designation D=department
//          E=startDate     F=endDate        G=mode        H=compensation
//          I=created_at    J=emailStatus    K=offerId     L=valid_until
//          M=approval_status N=pdfTemplateId O=generatedBy P=hrDepartment
function rowToOffer(row, sheetRowIndex) {
  const validUntil = row[11] || null;  // Column L
  const approvalStatus = row[12] || 'Pending Approval'; // Column M
  const pdfTemplateId = row[13] || null; // Column N
  const generatedBy = row[14] || null; // Column O
  const hrDepartment = row[15] || null; // Column P
  const status     = row[9]  || 'Draft';

  // Auto-derive Expired status if past valid_until and not terminal
  const terminalStatuses = ['Accepted', 'Declined', 'Expired'];
  const effectiveStatus = (
    validUntil &&
    !terminalStatuses.includes(status) &&
    new Date() > new Date(validUntil)
  ) ? 'Expired' : status;

  return {
    id:              row[10] || String(sheetRowIndex),   // Column K (UUID)
    sheet_row:       sheetRowIndex,
    candidate_name:  row[0]  || '',
    candidate_email: row[1]  || '',
    designation:     row[2]  || '',
    department:      row[3]  || '',
    start_date:      row[4]  || '',
    end_date:        row[5]  || '',
    mode:            row[6]  || '',
    compensation:    row[7]  || '',
    created_at:      row[8]  || new Date().toISOString(),
    status:          effectiveStatus,
    valid_until:     validUntil,
    approval_status: approvalStatus,
    pdf_template_id: pdfTemplateId,
    generated_by:    generatedBy,
    hr_department:   hrDepartment,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// POST /api/offers/preview
// ═══════════════════════════════════════════════════════════════════════
const previewOffer = async (req, res) => {
  try {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(', ') });
    }

    const {
      candidateName, candidateEmail, designation, department,
      startDate, endDate, mode, compensation, offerIssueDate, validUntil, pdfTemplateId
    } = parsed.data;

    let derivedCompensation = compensation ? String(compensation).trim() : 'Unpaid Internship';
    if (!isNaN(derivedCompensation) && derivedCompensation.trim() !== '') {
      derivedCompensation = `₹${Number(derivedCompensation).toLocaleString('en-IN')} per month`;
    }

    const compLower = derivedCompensation.toLowerCase();
    const compensationType = (!compensation || compensation === '0' || compLower.includes('unpaid')) ? 'unpaid' : 'paid';

    // Format valid_until for PDF display
    const validUntilDisplay = validUntil
      ? new Date(validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : null;

    const candidateData = {
      candidateName, candidateEmail, designation,
      department: department || 'N/A',
      startDate, endDate,
      mode: mode || 'Remote',
      compensation: derivedCompensation,
      compensationType,
      offerIssueDate: offerIssueDate || new Date().toLocaleDateString(),
      validUntil: validUntilDisplay || 'Not specified',
    };

    console.log('Generating PDF for preview...');
    let customTemplateHtml = null;
    if (pdfTemplateId) customTemplateHtml = await getPdfTemplateHtml(pdfTemplateId);
    const pdfBuffer = await generatePdf(candidateData, { customTemplateHtml });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="preview.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Preview Offer Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate preview' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// POST /api/offers/generate
// ═══════════════════════════════════════════════════════════════════════
const generateOffer = async (req, res) => {
  try {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(', ') });
    }

    const {
      candidateName, candidateEmail, designation, department,
      startDate, endDate, mode, compensation, offerIssueDate, validUntil, pdfTemplateId
    } = parsed.data;

    // Sanitize compensation
    let derivedCompensation = compensation ? String(compensation).trim() : 'Unpaid Internship';
    if (!isNaN(derivedCompensation) && derivedCompensation.trim() !== '') {
      derivedCompensation = `₹${Number(derivedCompensation).toLocaleString('en-IN')} per month`;
    }

    const compLower = derivedCompensation.toLowerCase();
    const compensationType = (!compensation || compensation === '0' || compLower.includes('unpaid')) ? 'unpaid' : 'paid';
    const offerId = makeId();

    const validUntilDisplay = validUntil
      ? new Date(validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : null;

    const candidateData = {
      candidateName, candidateEmail, designation,
      department: department || 'N/A',
      startDate, endDate,
      mode: mode || 'Remote',
      compensation: derivedCompensation,
      compensationType,
      offerIssueDate: offerIssueDate || new Date().toLocaleDateString(),
      validUntil: validUntilDisplay || 'Not specified',
    };

    const actorRole = req.user?.role || 'user';
    // Changed to always auto-approve so emails send immediately for testing/usage
    const isAutoApproved = true; 
    const approvalStatus = isAutoApproved ? 'Approved' : 'Pending Approval';
    let emailStatus = 'Draft';
    let pdfBuffer = null;

    // Only send email immediately if auto-approved
    if (isAutoApproved) {
      console.log('Generating PDF and sending email (Auto-approved)...');
      try {
        let customTemplateHtml = null;
        if (pdfTemplateId) customTemplateHtml = await getPdfTemplateHtml(pdfTemplateId);
        pdfBuffer = await generatePdf(candidateData, { customTemplateHtml });
        const templateVars = {
          candidate_name: candidateName,
          role:           designation,
          joining_date:   candidateData.startDate,
          end_date:       candidateData.endDate,
          mode:           candidateData.mode,
          valid_until:    validUntilDisplay || 'Not set',
        };
        let emailContent = await resolveEmailContent(offerId, templateVars).catch(() => null);
        
        // Generate token and append to email
        const token = await createResponseToken(offerId, candidateData.validUntil);
        if (token && emailContent) {
          const responseLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/respond/${token}`;
          emailContent.htmlBody += `<br><hr><br>
            <p><strong>Please let us know your decision:</strong></p>
            <a href="${responseLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Respond to Offer</a>
            <p><small>Or copy and paste this link: <a href="${responseLink}">${responseLink}</a></small></p>`;
        }
        
        await sendOfferEmail(candidateEmail, candidateName, pdfBuffer, emailContent || {});
        emailStatus = 'Sent';
      } catch (emailError) {
        console.error('Email failed to send:', emailError);
        emailStatus = 'Failed';
      }
    } else {
      console.log('Offer generated as Draft/Pending Approval, skipping email send.');
    }

    // 3. Save to Google Sheets (A:L — 12 columns including valid_until)
    if (sheets && process.env.GOOGLE_SHEET_ID) {
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Sheet1!A:A',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              candidateName, candidateEmail, designation, department || 'N/A',
              startDate, endDate, mode || 'Remote', derivedCompensation,
              new Date().toISOString(), emailStatus, offerId,
              validUntil || '', approvalStatus, pdfTemplateId || '',
              req.user?.email || 'unknown', req.user?.department || ''
            ]]
          }
        });
      } catch (sheetsError) {
        console.error('Google Sheets append error:', sheetsError);
      }
    }

    // 4. Log Audit
    const actorEmail = req.user?.email || 'unknown';
    await logAudit(offerId, actorEmail, 'generated', { after: candidateData });

    res.status(200).json({ message: 'Offer generated and processed successfully', status: emailStatus, offerId });
  } catch (error) {
    console.error('Error in generateOffer:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/offers
// ═══════════════════════════════════════════════════════════════════════
const getOffers = async (req, res) => {
  try {
    if (sheets && process.env.GOOGLE_SHEET_ID) {
      const rows = await getAllRows();
      if (rows.length > 1) {
        // rows[0] is the header; data rows start at index 1 → sheet row 2
        let data = rows.slice(1)
          .map((row, i) => rowToOffer(row, i + 2))
          .filter(o => o.candidate_name !== '');

        if (req.user?.role === 'hr') {
          data = data.filter(o => o.generated_by === req.user.email);
        }

        return res.status(200).json(data.reverse());
      }
    }
    res.status(200).json([]);
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/offers/:id
// ═══════════════════════════════════════════════════════════════════════
const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(503).json({ error: 'Google Sheets not configured' });
    }

    const rows = await getAllRows();
    if (rows.length <= 1) return res.status(404).json({ error: 'No offers found' });

    // Search by column K (offerId) or sheet_row index fallback
    const dataRows = rows.slice(1);
    let matchRow = null;
    let matchSheetRow = null;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const sheetRow = i + 2;
      const rowId = row[10];        // Column K = offerId

      if (rowId === id) {
        matchRow = row;
        matchSheetRow = sheetRow;
        break;
      }
    }

    if (!matchRow) return res.status(404).json({ error: 'Offer not found' });
    res.status(200).json(rowToOffer(matchRow, matchSheetRow));
  } catch (error) {
    console.error('Error in getOfferById:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// POST /api/offers/:id/resend
// ═══════════════════════════════════════════════════════════════════════
const resendOffer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(503).json({ error: 'Google Sheets not configured' });
    }

    const rows = await getAllRows();
    if (rows.length <= 1) return res.status(404).json({ error: 'No offers found' });

    const dataRows = rows.slice(1);
    let matchRow = null;
    let matchSheetRow = null;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const sheetRow = i + 2;
      if ((row[10] || '') === id) {
        matchRow = row;
        matchSheetRow = sheetRow;
        break;
      }
    }

    if (!matchRow) return res.status(404).json({ error: 'Offer not found' });

    const offer = rowToOffer(matchRow, matchSheetRow);
    const compLower = (offer.compensation || '').toLowerCase();
    const compensationType = (!offer.compensation || offer.compensation === '0' || compLower.includes('unpaid')) ? 'unpaid' : 'paid';

    const candidateData = {
      candidateName:   offer.candidate_name,
      candidateEmail:  offer.candidate_email,
      designation:     offer.designation,
      department:      offer.department,
      startDate:       offer.start_date,
      endDate:         offer.end_date,
      mode:            offer.mode,
      compensation:    offer.compensation,
      compensationType,
      offerIssueDate:  new Date().toLocaleDateString(),
    };

    // Re-generate PDF
    const pdfBuffer = await generatePdf(candidateData);

    // Resend email (with optional template)
    let newStatus = 'Failed';
    try {
      const templateVars = {
        candidate_name: offer.candidate_name,
        role:           offer.designation,
        joining_date:   offer.start_date,
        end_date:       offer.end_date,
        mode:           offer.mode,
        valid_until:    offer.valid_until
          ? new Date(offer.valid_until).toLocaleDateString('en-IN') : 'Not set',
      };
      const emailContent = await resolveEmailContent(offer.id, templateVars).catch(() => null);
      await sendOfferEmail(offer.candidate_email, offer.candidate_name, pdfBuffer, emailContent || {});
      newStatus = 'Sent';
    } catch (emailError) {
      console.error('Resend email failed:', emailError);
    }

    // Update status in column J of the matched sheet row
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!J${matchSheetRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[newStatus]] }
    });
    // Log Audit
    const actorEmail = req.user?.email || 'unknown';
    await logAudit(offer.id, actorEmail, 'resent');

    res.status(200).json({ message: `Offer resent. Status: ${newStatus}`, status: newStatus });
  } catch (error) {
    console.error('Error in resendOffer:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// PUT /api/offers/:id
// ═══════════════════════════════════════════════════════════════════════
const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map(i => i.message).join(', ') });
    }

    const {
      candidateName, candidateEmail, designation, department,
      startDate, endDate, mode, compensation, offerIssueDate, validUntil
    } = parsed.data;
    
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(503).json({ error: 'Google Sheets not configured' });
    }

    const rows = await getAllRows();
    if (rows.length <= 1) return res.status(404).json({ error: 'No offers found' });

    const dataRows = rows.slice(1);
    let matchRow = null;
    let matchSheetRow = null;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const sheetRow = i + 2;
      if ((row[10] || '') === id) {
        matchRow = row;
        matchSheetRow = sheetRow;
        break;
      }
    }

    if (!matchRow) return res.status(404).json({ error: 'Offer not found' });

    const derivedCompensation = compensation || 'Unpaid Internship';
    const compLower = derivedCompensation.toLowerCase();
    const compensationType = (!compensation || compensation === '0' || compLower.includes('unpaid')) ? 'unpaid' : 'paid';

    const validUntilDisplay = validUntil
      ? new Date(validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : null;

    const candidateData = {
      candidateName, candidateEmail, designation,
      department: department || 'N/A',
      startDate, endDate,
      mode: mode || 'Remote',
      compensation: derivedCompensation,
      compensationType,
      offerIssueDate: new Date().toLocaleDateString(),
      validUntil: validUntilDisplay || 'Not specified',
    };

    // Re-generate PDF
    const pdfBuffer = await generatePdf(candidateData);

    // Resend email
    let newStatus = 'Failed';
    try {
      await sendOfferEmail(candidateEmail, candidateName, pdfBuffer);
      newStatus = 'Sent';
    } catch (emailError) {
      console.error('Resend email failed:', emailError);
    }

    // Update cells A to H, J (status), and L (valid_until)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!A${matchSheetRow}:H${matchSheetRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[
        candidateName, candidateEmail, designation, department || 'N/A',
        startDate, endDate, mode || 'Remote', derivedCompensation
      ]] }
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!J${matchSheetRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[newStatus]] }
    });
    if (validUntil !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Sheet1!L${matchSheetRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[validUntil || '']] }
      });
    }
    if (pdfTemplateId !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Sheet1!N${matchSheetRow}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[pdfTemplateId || '']] }
      });
    }

    // Log Audit
    const actorEmail = req.user?.email || 'unknown';
    await logAudit(matchOfferId, actorEmail, 'updated', {
      before: offer,
      after: candidateData
    });

    res.status(200).json({ message: `Offer updated and resent. Status: ${newStatus}`, status: newStatus });
  } catch (error) {
    console.error('Error in updateOffer:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// POST /api/offers/:id/approve
// ═══════════════════════════════════════════════════════════════════════
const approveOffer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!sheets || !process.env.GOOGLE_SHEET_ID) return res.status(503).json({ error: 'Google Sheets not configured' });

    const rows = await getAllRows();
    const matchRowIndex = rows.findIndex(r => r[10] === id);
    if (matchRowIndex === -1) return res.status(404).json({ error: 'Offer not found' });
    const sheetRowIndex = matchRowIndex + 1;
    const offer = rowToOffer(rows[matchRowIndex], sheetRowIndex);

    if (offer.approval_status === 'Approved') {
      return res.status(400).json({ error: 'Offer is already approved' });
    }

    const candidateData = {
      candidateName: offer.candidate_name, candidateEmail: offer.candidate_email,
      designation: offer.designation, department: offer.department,
      startDate: offer.start_date, endDate: offer.end_date,
      mode: offer.mode, compensation: offer.compensation,
      validUntil: offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not specified',
    };

    console.log(`Approving offer ${id}. Generating PDF and sending email...`);
    let emailStatus = 'Pending';
    try {
      let customTemplateHtml = null;
      if (offer.pdf_template_id) customTemplateHtml = await getPdfTemplateHtml(offer.pdf_template_id);
      const pdfBuffer = await generatePdf(candidateData, { customTemplateHtml });
      const templateVars = {
        candidate_name: candidateData.candidateName,
        role:           candidateData.designation,
        joining_date:   candidateData.startDate,
        end_date:       candidateData.endDate,
        mode:           candidateData.mode,
        valid_until:    candidateData.validUntil,
      };
      let emailContent = await resolveEmailContent(offer.id, templateVars).catch(() => null);

      // Generate token and append to email
      const token = await createResponseToken(offer.id, candidateData.validUntil);
      if (token && emailContent) {
        const responseLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/respond/${token}`;
        emailContent.htmlBody += `<br><hr><br>
          <p><strong>Please let us know your decision:</strong></p>
          <a href="${responseLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Respond to Offer</a>
          <p><small>Or copy and paste this link: <a href="${responseLink}">${responseLink}</a></small></p>`;
      }

      await sendOfferEmail(candidateData.candidateEmail, candidateData.candidateName, pdfBuffer, emailContent || {});
      emailStatus = 'Sent';
    } catch (emailError) {
      console.error('Email failed to send during approval:', emailError);
      emailStatus = 'Failed';
    }

    // Update Status (Col J) and Approval Status (Col M)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!J${sheetRowIndex}:M${sheetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[emailStatus, offer.id, offer.valid_until || '', 'Approved']] }
    });

    const actorEmail = req.user?.email || 'unknown';
    await logAudit(offer.id, actorEmail, 'approved', { resultStatus: emailStatus });

    res.status(200).json({ message: 'Offer approved and sent', status: emailStatus, approval_status: 'Approved' });
  } catch (error) {
    console.error('Error in approveOffer:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// POST /api/offers/:id/reject
// ═══════════════════════════════════════════════════════════════════════
const rejectOffer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!sheets || !process.env.GOOGLE_SHEET_ID) return res.status(503).json({ error: 'Google Sheets not configured' });

    const rows = await getAllRows();
    const matchRowIndex = rows.findIndex(r => r[10] === id);
    if (matchRowIndex === -1) return res.status(404).json({ error: 'Offer not found' });
    const sheetRowIndex = matchRowIndex + 1;
    const offer = rowToOffer(rows[matchRowIndex], sheetRowIndex);

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!M${sheetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [['Rejected']] }
    });

    const actorEmail = req.user?.email || 'unknown';
    await logAudit(offer.id, actorEmail, 'rejected');

    res.status(200).json({ message: 'Offer rejected', approval_status: 'Rejected' });
  } catch (error) {
    console.error('Error in rejectOffer:', error);
    res.status(500).json({ error: 'Failed to reject offer' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/offers/:id/pdf
// ═══════════════════════════════════════════════════════════════════════
const downloadOfferPdf = async (req, res) => {
  try {
    const { id } = req.params;
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(503).json({ error: 'Google Sheets not configured' });
    }

    const rows = await getAllRows();
    const dataRows = rows.slice(1);
    let matchRow = null;
    for (let i = 0; i < dataRows.length; i++) {
      if (dataRows[i][10] === id) {
        matchRow = dataRows[i];
        break;
      }
    }

    if (!matchRow) return res.status(404).json({ error: 'Offer not found' });

    const pdfTemplateId = matchRow[13] || null;
    let customTemplateHtml = null;
    if (pdfTemplateId) customTemplateHtml = await getPdfTemplateHtml(pdfTemplateId);

    const derivedCompensation = matchRow[7] || 'Unpaid Internship';
    const compLower = derivedCompensation.toLowerCase();
    const compensationType = (!matchRow[7] || matchRow[7] === '0' || compLower.includes('unpaid')) ? 'unpaid' : 'paid';
    
    const validUntilDisplay = matchRow[11]
      ? new Date(matchRow[11]).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'Not specified';

    const candidateData = {
      candidateName: matchRow[0] || '',
      candidateEmail: matchRow[1] || '',
      designation: matchRow[2] || '',
      department: matchRow[3] || 'N/A',
      startDate: matchRow[4] || '',
      endDate: matchRow[5] || '',
      mode: matchRow[6] || 'Remote',
      compensation: derivedCompensation,
      compensationType,
      offerIssueDate: matchRow[8] ? new Date(matchRow[8]).toLocaleDateString() : new Date().toLocaleDateString(),
      validUntil: validUntilDisplay,
    };

    const pdfBuffer = await generatePdf(candidateData, { customTemplateHtml });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Offer_${id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF for download:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

module.exports = { generateOffer, previewOffer, getOffers, getOfferById, resendOffer, updateOffer, approveOffer, rejectOffer, downloadOfferPdf, rowToOffer };
