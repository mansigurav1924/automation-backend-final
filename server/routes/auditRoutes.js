const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAuditLogs } = require('../controllers/auditController');

router.use(auth);

router.get('/:offerId', getAuditLogs);

module.exports = router;
