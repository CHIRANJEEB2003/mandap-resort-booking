const express = require('express');
const router = express.Router();
const wc = require('../controllers/wedding.controller');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/requireRole');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/packages',       wc.getPublicWeddingPackages);
router.get('/photography',    wc.getPublicPhotographyServices);
router.get('/decoration',     wc.getPublicDecorationServices);
router.get('/gallery',        wc.getPublicGallery);
router.get('/venue/:propertyId', wc.getPublicVenueWeddingData);

// ── Owner ─────────────────────────────────────────────────────────────────────
router.use('/owner', authenticate, requireRole('OWNER'));

router.get('/owner/packages',         wc.ownerGetWeddingPackages);
router.post('/owner/packages',        wc.ownerCreateWeddingPackage);
router.put('/owner/packages/:id',     wc.ownerUpdateWeddingPackage);
router.delete('/owner/packages/:id',  wc.ownerDeleteWeddingPackage);

router.get('/owner/photography',         wc.ownerGetPhotographyServices);
router.post('/owner/photography',        wc.ownerCreatePhotographyService);
router.put('/owner/photography/:id',     wc.ownerUpdatePhotographyService);
router.delete('/owner/photography/:id',  wc.ownerDeletePhotographyService);

router.get('/owner/decoration',         wc.ownerGetDecorationServices);
router.post('/owner/decoration',        wc.ownerCreateDecorationService);
router.put('/owner/decoration/:id',     wc.ownerUpdateDecorationService);
router.delete('/owner/decoration/:id',  wc.ownerDeleteDecorationService);

router.get('/owner/gallery',          wc.ownerGetGallery);
router.post('/owner/gallery',         wc.ownerAddGalleryPhoto);
router.put('/owner/gallery/:id',      wc.ownerUpdateGalleryPhoto);
router.delete('/owner/gallery/:id',   wc.ownerDeleteGalleryPhoto);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.use('/admin', authenticate, requireRole('ADMIN'));

router.get('/admin/overview',      wc.adminGetOverview);
router.get('/admin/packages',      wc.adminGetAllWeddingPackages);
router.get('/admin/photography',   wc.adminGetAllPhotographyServices);
router.get('/admin/decoration',    wc.adminGetAllDecorationServices);
router.put('/admin/packages/:id/toggle', wc.adminToggleWeddingPackage);

module.exports = router;
