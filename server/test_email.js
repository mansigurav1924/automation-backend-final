require('dotenv').config();
const sendOfferEmail = require('./utils/emailSender');

async function test() {
  try {
    const pdfBuffer = Buffer.from('test pdf content');
    console.log('Attempting to send email...');
    const info = await sendOfferEmail('mgurav2412@gmail.com', 'Test Candidate', pdfBuffer);
    console.log('Email sent successfully!', info.messageId);
  } catch (error) {
    console.error('Email failed to send:', error);
  }
}

test();
