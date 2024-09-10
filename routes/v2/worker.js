const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../middleware/verify-middleware')
const staffController = require('../../controllers/staff-controllers')


// Get Profile Details
router.get('/initial-info', verifyToken, staffController.getInitialAccountInfo)
router.get('/profile/:accId', verifyToken, staffController.getSingeStaffInfo)
router.put('/profile/:accId/address', verifyToken, verifyOrigin, staffController.updateWorkerAddress)
router.put('/profile/:accId/contact', verifyToken, verifyOrigin, staffController.updateWorkerContact)


module.exports = router