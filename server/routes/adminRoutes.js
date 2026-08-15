const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { getAdminUsers, getAdminOffers, updateUserRole, deleteUser, createUser, getSystemHealth } = require('../controllers/adminController');

router.use(auth);
router.use(role(['admin']));

router.get('/health', getSystemHealth);
router.get('/users', getAdminUsers);
router.post('/users', createUser);
router.put('/users/:email/role', updateUserRole);
router.delete('/users/:email', deleteUser);
router.get('/offers', getAdminOffers);

module.exports = router;
