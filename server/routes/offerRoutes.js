const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateOffer, previewOffer, getOffers, getOfferById, resendOffer, updateOffer, approveOffer, rejectOffer, downloadOfferPdf } = require('../controllers/offerController');
const { exportOffers } = require('../controllers/exportController');

const checkAdminOrHrHead = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'hr_head') {
    return res.status(403).json({ error: 'Forbidden: Requires admin or hr_head role' });
  }
  next();
};

router.post('/preview',         previewOffer);

// Apply auth middleware to all routes in this router
router.use(auth);

router.get('/export',           exportOffers);    // Must be before /:id
router.post('/generate',        generateOffer);
router.get('/',                 getOffers);
router.get('/:id',              getOfferById);
router.get('/:id/pdf',          downloadOfferPdf);
router.put('/:id',              updateOffer);
router.post('/:id/resend',      resendOffer);
router.post('/:id/approve',     checkAdminOrHrHead, approveOffer);
router.post('/:id/reject',      checkAdminOrHrHead, rejectOffer);

module.exports = router;
