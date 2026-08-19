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

// ── Build a base64url-encoded RFC 2822 message ────────────────────────────────
function buildRawMessage({ to, subject, html, pdfBuffer }) {
  const boundary = 'BOUNDARY_' + Date.now();

  const headers = [
    `To: ${to}`,
    `From: "RGT OfferFlow" <${process.env.EMAIL_USER}>`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].join('\r\n');

  // HTML part
  const htmlPart = [
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html).toString('base64'),
  ].join('\r\n');

  // Optional PDF attachment
  const pdfPart = pdfBuffer && pdfBuffer.length
    ? [
        `--${boundary}`,
        'Content-Type: application/pdf',
        'Content-Transfer-Encoding: base64',
        'Content-Disposition: attachment; filename="Offer_Letter.pdf"',
        '',
        pdfBuffer.toString('base64'),
      ].join('\r\n')
    : '';

  const raw = [headers, '', htmlPart, pdfPart, `--${boundary}--`]
    .filter(Boolean)
    .join('\r\n');

  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── Low-level sender (used internally) ───────────────────────────────────────
async function sendEmail({ to, subject, html, pdfBuffer }) {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const raw = buildRawMessage({ to, subject, html, pdfBuffer });

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

// ── Public API — preserves the original call signature used across the codebase
// sendOfferEmail(candidateEmail, candidateName, pdfBuffer, options)
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

  return sendEmail({ to: candidateEmail, subject, html, pdfBuffer });
};

module.exports = sendOfferEmail;
module.exports.sendEmail = sendEmail;
