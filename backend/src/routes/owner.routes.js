const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/owner.controller');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const { upload } = require('../middleware/upload');

router.use(authenticate, requireRole('OWNER'));

router.get('/dashboard', ownerController.getDashboard);
router.get('/profile', ownerController.getProfile);
router.put('/profile', ownerController.updateProfile);
router.post('/documents', upload.single('file'), ownerController.uploadDocument);
router.get('/documents', ownerController.getDocuments);
router.get('/properties', ownerController.getProperties);
router.get('/bookings', ownerController.getBookings);
router.get('/revenue', ownerController.getRevenue);
router.get('/calendar', ownerController.getCalendar);
router.get('/staff', ownerController.getStaff);
router.post('/staff', ownerController.addStaff);
router.put('/staff/:id', ownerController.updateStaff);
router.delete('/staff/:id', ownerController.deleteStaff);

module.exports = router;
