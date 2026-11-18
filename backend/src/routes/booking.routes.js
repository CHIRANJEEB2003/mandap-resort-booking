const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

router.use(authenticate);

// Customer: create booking enquiry
router.post('/',
  requireRole('CUSTOMER'),
  [
    body('propertyId').isUUID(),
    body('eventDate').isISO8601(),
    body('eventType').notEmpty(),
    body('guestCount').isInt({ min: 1 }),
  ],
  validate,
  bookingController.createBooking
);

// Shared: get a single booking
router.get('/:id', bookingController.getBooking);

// Customer
router.get('/my/bookings', requireRole('CUSTOMER'), bookingController.getMyBookings);
router.post('/:id/cancel', requireRole('CUSTOMER'), bookingController.cancelByCustomer);
router.post('/:id/hide', requireRole('CUSTOMER'), bookingController.hideFromHistory);
router.post('/:id/review', requireRole('CUSTOMER'), bookingController.submitReview);

// Owner
router.get('/owner/requests', requireRole('OWNER'), bookingController.getOwnerRequests);
router.post('/:id/confirm', requireRole('OWNER'), bookingController.confirmBooking);
router.post('/:id/reject', requireRole('OWNER'), bookingController.rejectBooking);

// Admin
router.get('/admin/all', requireRole('ADMIN'), bookingController.getAllBookings);

module.exports = router;
