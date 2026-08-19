const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

// ── OAuth2 client ─────────────────────────────────────────────────────────────
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

// ── Build a base64url-encoded RFC 2822 MIME message ───────────────────────────
function buildMessage({ to, subject, html, attachment }) {
  const boundary = 'boundary_' + Date.now();

  const messageParts = [
    `To: ${to}`,
    `From: "RGT OfferFlow" <${process.env.EMAIL_USER}>`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
    '',
  ];

  if (attachment && attachment.content) {
    messageParts.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType || 'application/pdf'}; name="${attachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      '',
      attachment.content.toString('base64'),
      ''
    );
  }

  messageParts.push(`--${boundary}--`);

  return Buffer.from(messageParts.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── Low-level sender ──────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, attachment }) {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const raw = buildMessage({ to, subject, html, attachment });

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    return res.data;
  } catch (err) {
    console.error('Gmail API send error:', err.response?.data || err.message);
    throw new Error('Failed to send email via Gmail API');
  }
}

// ── Compatibility wrapper — preserves the original call signature ──────────────
// sendOfferEmail(candidateEmail, candidateName, pdfBuffer, options)
// Used by: generateOffer, approveOffer, reminderJob
// ─────────────────────────────────────────────────────────────────────────────
const sendOfferEmail = async (candidateEmail, candidateName, pdfBuffer, options = {}) => {
  const subject = options.subject
    || `Your Internship Offer Letter from RGTvertex`;

  const html = options.html
    || `<p>Dear <strong>${candidateName}</strong>,</p>
        <p>Greetings from RGTvertex!</p>
        <p>Congratulations!</p>
        <p>We are delighted to offer you an internship opportunity with RGTvertex. We appreciate your interest in joining our team and are excited to have you onboard.</p>
        <p>Please find your Internship Offer Letter attached to this email. The document contains your internship details, including your position, department, internship duration, mode of work, and other important information. Kindly review the offer letter carefully.</p>
        <p>If you accept this internship offer, please reply to this email with your confirmation at your earliest convenience.</p>
        <p>We are confident that this internship will provide you with valuable hands-on experience, practical learning opportunities, and professional growth. We look forward to working with you and wish you a successful internship journey at RGTvertex.</p>
        <p>If you have any questions or require any clarification, please feel free to reply to this email.</p>
        <p>Thank you, and welcome to RGTvertex!</p>
        <p>Warm Regards,<br/><strong>HR Team, RGTvertex</strong></p>`;

  const attachment = pdfBuffer && pdfBuffer.length
    ? { filename: 'Offer_Letter.pdf', content: pdfBuffer, contentType: 'application/pdf' }
    : null;

  return sendEmail({ to: candidateEmail, subject, html, attachment });
};

// Default export = sendOfferEmail (backward compat for all existing callers)
module.exports = sendOfferEmail;
// Named export for new direct usage (e.g. resendOffer)
module.exports.sendEmail = sendEmail;
