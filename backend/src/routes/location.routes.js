const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');

router.get('/states', locationController.getStates);
router.get('/nodes', locationController.getNodes);
router.get('/nodes/:id/children', locationController.getChildren);
router.get('/search', locationController.searchLocations);

module.exports = router;
