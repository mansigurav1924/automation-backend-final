const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',  // explicit host forces IPv4 on Render (avoids IPv6 ENETUNREACH)
  port: 587,
  secure: false,           // STARTTLS on port 587
  auth: process.env.GMAIL_CLIENT_ID ? {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  } : {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send the offer email.
 *
 * @param {string} candidateEmail
 * @param {string} candidateName
 * @param {Buffer} pdfBuffer
 * @param {object} [options]
 * @param {string} [options.subject]   - Custom subject (from template)
 * @param {string} [options.htmlBody]  - Custom HTML body (from template)
 */
const sendOfferEmail = async (candidateEmail, candidateName, pdfBuffer, options = {}) => {
  const subject = options.subject
    || `Your Internship Offer Letter from RGTvertex`;

  const htmlBody = options.html
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

  const mailOptions = {
    from: `"RGTvertex HR" <${process.env.EMAIL_USER}>`,
    to: candidateEmail,
    subject,
    html: htmlBody,
    attachments: [
      {
        filename: 'Offer_Letter.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendOfferEmail;
