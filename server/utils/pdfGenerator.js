const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const generatePdf = async (candidateData, options = {}) => {
  try {
    let htmlContent = options.customTemplateHtml;
    
    if (!htmlContent) {
      const templatePath = path.join(__dirname, '../templates/offerTemplate.html');
      htmlContent = fs.readFileSync(templatePath, 'utf8');
    }

    // Replace placeholders with escaped data
    for (const [key, value] of Object.entries(candidateData)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const safeValue = escapeHtml(value || '');
      htmlContent = htmlContent.replace(regex, safeValue);
    }

    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    try {
      const page = await browser.newPage();

      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded', // faster than networkidle0
        timeout: 120000,               // 2 min for Render free tier
      });

      // Allow fonts/styles to finish rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        timeout: 120000,
      });

      return pdfBuffer;
    } finally {
      await browser.close(); // always closes even if an error occurs
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

module.exports = generatePdf;
