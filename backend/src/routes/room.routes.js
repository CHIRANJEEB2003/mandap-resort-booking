const express = require('express');
const router = express.Router();
const roomCtrl = require('../controllers/room.controller');
const rbCtrl = require('../controllers/roomBooking.controller');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// ─── customer booking routes (must come before /:id) ─────────────────────────
router.post('/bookings',
  authenticate, requireRole('CUSTOMER'),
  [
    body('roomId').isUUID(),
    body('checkIn').isISO8601(),
    body('checkOut').isISO8601(),
    body('roomCount').isInt({ min: 1 }),
    body('guestCount').isInt({ min: 1 }),
  ],
  validate,
  rbCtrl.createRoomBooking
);
router.get('/bookings/my', authenticate, requireRole('CUSTOMER'), rbCtrl.getMyRoomBookings);
router.get('/bookings/:id', authenticate, rbCtrl.getRoomBookingDetail);
router.post('/bookings/:id/cancel', authenticate, requireRole('CUSTOMER'), rbCtrl.cancelRoomBooking);

// ─── owner routes (must come before /:id) ────────────────────────────────────
router.get('/owner/rooms', authenticate, requireRole('OWNER'), roomCtrl.getOwnerRooms);
router.post('/owner/rooms',
  authenticate, requireRole('OWNER'),
  [
    body('propertyId').isUUID(),
    body('category').isIn(['STANDARD', 'DELUXE', 'LUXURY']),
    body('name').notEmpty(),
    body('pricePerNight').isFloat({ min: 0 }),
    body('totalRooms').isInt({ min: 1 }),
  ],
  validate,
  roomCtrl.createRoom
);
router.put('/owner/rooms/:id', authenticate, requireRole('OWNER'), roomCtrl.updateRoom);
router.delete('/owner/rooms/:id', authenticate, requireRole('OWNER'), roomCtrl.deleteRoom);
router.post('/owner/rooms/:id/media', authenticate, requireRole('OWNER'), roomCtrl.addRoomMedia);
router.delete('/owner/rooms/:id/media/:mediaId', authenticate, requireRole('OWNER'), roomCtrl.deleteRoomMedia);
router.get('/owner/room-bookings', authenticate, requireRole('OWNER'), roomCtrl.getOwnerRoomBookings);
router.post('/owner/room-bookings/:id/confirm', authenticate, requireRole('OWNER'), roomCtrl.confirmRoomBooking);
router.post('/owner/room-bookings/:id/reject', authenticate, requireRole('OWNER'), roomCtrl.rejectRoomBooking);

// ─── admin routes (must come before /:id) ────────────────────────────────────
router.get('/admin/rooms', authenticate, requireRole('ADMIN'), roomCtrl.getAllRoomsAdmin);
router.put('/admin/rooms/:id/toggle', authenticate, requireRole('ADMIN'), roomCtrl.toggleRoomAdmin);
router.get('/admin/room-bookings', authenticate, requireRole('ADMIN'), roomCtrl.getAllRoomBookingsAdmin);

// ─── public routes ────────────────────────────────────────────────────────────
router.get('/', roomCtrl.listResortRooms);
router.get('/:id/availability', roomCtrl.checkRoomAvailability);
router.get('/:id', roomCtrl.getRoomDetail);

module.exports = router;
