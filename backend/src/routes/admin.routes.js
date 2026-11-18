const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');

router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.post('/users/admin', adminController.createAdminUser);

// Owner verification
router.get('/owners/pending', adminController.getPendingOwners);
router.get('/owners/by-type', adminController.getOwnersByType);
router.get('/owners/:id', adminController.getOwnerDetail);
router.post('/owners/:id/approve', adminController.approveOwner);
router.post('/owners/:id/reject', adminController.rejectOwner);
router.post('/owners/:id/suspend', adminController.suspendOwner);

// Property verification
router.get('/properties/pending', adminController.getPendingProperties);
router.get('/properties/by-category', adminController.getPropertiesByCategory);
router.get('/properties/:id', adminController.getPropertyDetail);
router.post('/properties/:id/approve', adminController.approveProperty);
router.post('/properties/:id/reject', adminController.rejectProperty);

// Bookings
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/:id', adminController.getBookingDetail);

// Finance
router.get('/finance/dashboard', adminController.getFinanceDashboard);
router.get('/finance/commissions', adminController.getCommissions);
router.put('/platform-config/commission', adminController.updateCommissionRate);

// Reports
router.get('/reports/revenue', adminController.revenueReport);
router.get('/reports/bookings', adminController.bookingsReport);
router.get('/audit-logs', adminController.getAuditLogs);

// Location management
router.get('/locations', adminController.getLocations);
router.post('/locations/state', adminController.addState);
router.post('/locations/node', adminController.addLocationNode);

// Owner registration by admin
router.post('/register-owner', adminController.registerOwner);

// Admin venue CRUD
router.get('/owners-dropdown', adminController.getOwnersForDropdown);
router.post('/venues', adminController.createVenue);
router.put('/venues/:id', adminController.updateVenue);
router.delete('/venues/:id', adminController.deleteVenue);
router.patch('/venues/:id/status', adminController.updateVenueStatus);

// (by-type and by-category moved above their :id routes)

// Reviews & Feedback
router.get('/reviews', adminController.getAllReviews);
router.put('/reviews/:id/toggle', adminController.toggleReview);
router.delete('/reviews/:id', adminController.deleteReview);

// Platform config (settings)
router.get('/config', adminController.getPlatformConfig);
router.put('/config', adminController.setPlatformConfig);

module.exports = router;
