const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');

router.use(authenticate, requireRole('CUSTOMER'));

router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);
router.get('/notifications', customerController.getNotifications);
router.put('/notifications/:id/read', customerController.markNotificationRead);
router.put('/notifications/read-all', customerController.markAllNotificationsRead);

module.exports = router;
