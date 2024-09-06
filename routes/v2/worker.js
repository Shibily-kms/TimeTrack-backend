const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/verify-middleware')
const staffController = require('../../controllers/staff-controllers')


// Get Profile Details
router.get('/initial-info', verifyToken, staffController.getInitialAccountInfo)


module.exports = router