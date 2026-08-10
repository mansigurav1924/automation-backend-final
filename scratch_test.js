const { z } = require('zod');
const { generatePdf } = require('../server/utils/pdfGenerator');

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
});

async function run() {
  const reqBody = {
    candidateName: 'Test',
    candidateEmail: 'test@example.com',
    designation: 'Intern',
    startDate: '2026-08-10',
    endDate: '2026-10-10'
  };

  const parsed = offerSchema.safeParse(reqBody);
  console.log('Parsed:', parsed.success);
  if (!parsed.success) {
    console.log(parsed.error.issues);
    return;
  }

  const candidateData = {
    candidateName: 'Test',
    candidateEmail: 'test@test.com',
    designation: 'Test',
    department: 'N/A',
    startDate: '2026-08-10',
    endDate: '2026-10-10',
    mode: 'Remote',
    compensation: 'Unpaid',
    compensationType: 'unpaid',
    offerIssueDate: '2026-08-10',
    validUntil: 'Not specified',
  };

  try {
    const generatePdf = require('../server/utils/pdfGenerator');
    console.log('Generating PDF...');
    const pdfBuffer = await generatePdf(candidateData, {});
    console.log('Success!', pdfBuffer.length);
  } catch (error) {
    console.error('Error:', error);
  }
}
run();
