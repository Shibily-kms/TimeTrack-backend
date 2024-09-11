const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../middleware/verify-middleware')
const staffController = require('../../controllers/staff-controllers')
const deviceController = require('../../controllers/device-controller')

//? Base Route : /v2/worker
//? Base In Domain : api.staff.domain.com/v2/worker/

// Get Profile Details
router.get('/initial-info', verifyToken, staffController.getInitialAccountInfo)
router.get('/profile/:accId', verifyToken, staffController.getSingeStaffInfo)
router.put('/profile/:accId/address', verifyToken, verifyOrigin, staffController.updateWorkerAddress)
router.put('/profile/:accId/contact', verifyToken, verifyOrigin, staffController.updateWorkerContact)

// De
router.get('/:accId/device', verifyToken, deviceController.getUserDevices)
router.delete('/:accId/device/:dvcId', verifyToken, deviceController.terminateDevice)


module.exports = router