const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');
const { upload } = require('../middleware/upload');

// Public routes
router.get('/', propertyController.listProperties);
router.get('/featured', propertyController.getFeatured);
router.get('/:slug', optionalAuth, propertyController.getPropertyBySlug);
router.get('/:id/availability', propertyController.getAvailability);
router.get('/:id/reviews', propertyController.getReviews);

// Owner routes
router.use(authenticate);
router.post('/', requireRole('OWNER'), propertyController.createProperty);
router.put('/:id', requireRole('OWNER'), propertyController.updateProperty);
router.delete('/:id', requireRole('OWNER'), propertyController.deleteProperty);
router.post('/:id/media', requireRole('OWNER'), upload.array('files', 20), propertyController.uploadMedia);
router.delete('/:id/media/:mediaId', requireRole('OWNER'), propertyController.deleteMedia);

// Hall management
router.post('/:id/halls', requireRole('OWNER'), propertyController.addHall);
router.put('/:id/halls/:hallId', requireRole('OWNER'), propertyController.updateHall);
router.delete('/:id/halls/:hallId', requireRole('OWNER'), propertyController.deleteHall);

// Pricing
router.post('/:id/pricing', requireRole('OWNER'), propertyController.setPricing);

// Resources
router.get('/:id/resources', authenticate, propertyController.getResources);
router.post('/:id/resources', requireRole('OWNER'), propertyController.addResource);
router.put('/:id/resources/:resourceId', requireRole('OWNER'), propertyController.updateResource);

// Catering packages
router.get('/:id/catering', propertyController.getCateringPackages);
router.post('/:id/catering', requireRole('OWNER'), propertyController.addCateringPackage);
router.put('/:id/catering/:pkgId', requireRole('OWNER'), propertyController.updateCateringPackage);
router.delete('/:id/catering/:pkgId', requireRole('OWNER'), propertyController.deleteCateringPackage);

// Decoration packages
router.get('/:id/decoration', propertyController.getDecorationPackages);
router.post('/:id/decoration', requireRole('OWNER'), propertyController.addDecorationPackage);
router.put('/:id/decoration/:pkgId', requireRole('OWNER'), propertyController.updateDecorationPackage);
router.delete('/:id/decoration/:pkgId', requireRole('OWNER'), propertyController.deleteDecorationPackage);

module.exports = router;
