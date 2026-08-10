const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { getAdminUsers, getAdminOffers } = require('../controllers/adminController');

router.use(auth);
router.use(role(['admin']));

router.get('/users', getAdminUsers);
router.get('/offers', getAdminOffers);

module.exports = router;
