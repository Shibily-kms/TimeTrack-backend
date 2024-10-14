const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middleware/verify-middleware')
const staffController = require('../../../controllers/staff-controllers')
const deviceController = require('../../../controllers/device-controller')

//? Base Route : /v2/worker
//? Base In Domain : api.staff.domain.com/v2/worker/


// Get single Details
router.get('/initial-info', verifyToken, staffController.getInitialAccountInfo)
router.get('/account/:accId', verifyToken, staffController.getSingeStaffInfo)

// Update Account
router.put('/account/:accId/address', verifyToken, staffController.updateWorkerAddress)
router.put('/account/:accId/contact', verifyToken, staffController.updateWorkerContact)

// Device
router.get('/:accId/device', verifyToken, deviceController.getUserDevices)
router.delete('/:accId/device/:dvcId', verifyToken, deviceController.terminateDevice)



// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});

module.exports = router