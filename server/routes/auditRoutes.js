const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAuditLogs, getRecentAuditLogs, getAllAuditLogs } = require('../controllers/auditController');
const roleMiddleware = require('../middleware/role');

router.use(auth);

router.get('/', roleMiddleware(['admin']), getAllAuditLogs);
router.get('/recent', roleMiddleware(['admin']), getRecentAuditLogs);
router.get('/:offerId', getAuditLogs);

module.exports = router;
