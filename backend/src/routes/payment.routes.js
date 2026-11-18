const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');

// Razorpay webhook — no auth, verified by signature
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

router.use(authenticate);

router.post('/create-order', requireRole('CUSTOMER'), paymentController.createOrder);
router.post('/verify', requireRole('CUSTOMER'), paymentController.verifyPayment);
router.get('/history', requireRole('CUSTOMER'), paymentController.getPaymentHistory);

module.exports = router;
