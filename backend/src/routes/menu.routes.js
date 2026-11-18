const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const ctrl = require('../controllers/menu.controller');

// ── Public (no auth required) ──────────────────────────────────────────────
router.get('/categories', ctrl.getMenuCategories);
router.get('/items', ctrl.getMenuItems);
router.get('/packages', ctrl.getMenuPackages);

// ── Customer ───────────────────────────────────────────────────────────────
router.post('/selection', authenticate, requireRole('CUSTOMER'), ctrl.saveMenuSelection);
router.get('/selection', authenticate, ctrl.getMenuSelection);

// ── Admin ──────────────────────────────────────────────────────────────────
router.get('/admin/categories', authenticate, requireRole('ADMIN'), ctrl.adminGetCategories);
router.post('/admin/categories', authenticate, requireRole('ADMIN'), ctrl.adminCreateCategory);
router.put('/admin/categories/:id', authenticate, requireRole('ADMIN'), ctrl.adminUpdateCategory);

router.get('/admin/items', authenticate, requireRole('ADMIN'), ctrl.adminGetItems);
router.post('/admin/items', authenticate, requireRole('ADMIN'), ctrl.adminCreateItem);
router.put('/admin/items/:id', authenticate, requireRole('ADMIN'), ctrl.adminUpdateItem);
router.delete('/admin/items/:id', authenticate, requireRole('ADMIN'), ctrl.adminDeleteItem);

router.get('/admin/packages', authenticate, requireRole('ADMIN'), ctrl.adminGetPackages);
router.post('/admin/packages', authenticate, requireRole('ADMIN'), ctrl.adminCreatePackage);
router.put('/admin/packages/:id', authenticate, requireRole('ADMIN'), ctrl.adminUpdatePackage);
router.delete('/admin/packages/:id', authenticate, requireRole('ADMIN'), ctrl.adminDeletePackage);

router.get('/admin/selections', authenticate, requireRole('ADMIN'), ctrl.adminGetAllSelections);

module.exports = router;
