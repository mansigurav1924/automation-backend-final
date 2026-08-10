const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
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

  const htmlBody = options.htmlBody
    || `<p>Dear <strong>${candidateName}</strong>,</p>
        <p>Congratulations! We are thrilled to offer you an internship at RGTvertex. 
        Please find your offer letter attached.</p>
        <p>Best regards,<br/><strong>HR Team, RGTvertex</strong></p>`;

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
