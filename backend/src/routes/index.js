const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/properties', require('./property.routes'));
router.use('/bookings', require('./booking.routes'));
router.use('/owner', require('./owner.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/customer', require('./customer.routes'));
router.use('/locations', require('./location.routes'));
router.use('/uploads', require('./upload.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/rooms', require('./room.routes'));
router.use('/menus', require('./menu.routes'));
router.use('/wedding', require('./wedding.routes'));

module.exports = router;
