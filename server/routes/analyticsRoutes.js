const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAnalyticsSummary } = require('../controllers/analyticsController');

router.use(auth);
router.get('/summary', getAnalyticsSummary);

module.exports = router;
