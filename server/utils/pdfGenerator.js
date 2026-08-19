const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
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
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.NODE_ENV === 'production'
        ? await chromium.executablePath()
        : puppeteer.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

module.exports = generatePdf;
