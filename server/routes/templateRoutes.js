const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  listTemplates,
  getDefaultTemplate,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getOfferOverride,
  upsertOfferOverride,
} = require('../controllers/templateController');

router.use(auth);

// Email template CRUD
router.get('/',               listTemplates);
router.get('/default',        getDefaultTemplate);
router.get('/:id',            getTemplate);
router.post('/',              createTemplate);
router.put('/:id',            updateTemplate);
router.delete('/:id',         deleteTemplate);

// Per-offer overrides
router.get('/overrides/:offerId',  getOfferOverride);
router.put('/overrides/:offerId',  upsertOfferOverride);

module.exports = router;
