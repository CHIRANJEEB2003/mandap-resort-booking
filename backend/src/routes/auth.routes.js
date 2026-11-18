const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');

// Phone OTP flow
router.post('/send-otp',
  [body('phone').isMobilePhone('en-IN').withMessage('Valid Indian mobile number required')],
  validate,
  authController.sendOtp
);

router.post('/verify-otp',
  [
    body('phone').isMobilePhone('en-IN'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
    body('role').isIn(['CUSTOMER', 'OWNER']),
    body('name').optional().isString().trim(),
  ],
  validate,
  authController.verifyOtp
);

// Email/phone + password login
router.post('/login',
  [
    body('identifier').notEmpty().withMessage('Email or mobile number is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

// Email + password self-registration
router.post('/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email address is required'),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['CUSTOMER', 'OWNER']).withMessage('Invalid role'),
  ],
  validate,
  authController.register
);

// Email + password (admin login)
router.post('/admin/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  authController.adminLogin
);

// Forgot / reset password
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  validate,
  authController.forgotPassword
);
router.post('/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  authController.resetPassword
);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
