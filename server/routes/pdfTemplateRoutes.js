const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPdfTemplates } = require('../controllers/pdfTemplateController');

router.use(auth);
router.get('/', getPdfTemplates);

module.exports = router;
