const express = require('express');
const router = express.Router();
const { getOfferByToken, submitResponse } = require('../controllers/responseController');

// Public routes (no auth required)
router.get('/:token', getOfferByToken);
router.post('/:token', submitResponse);

module.exports = router;
