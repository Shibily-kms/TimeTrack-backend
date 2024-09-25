const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../middleware/verify-middleware')
const staffController = require('../../controllers/staff-controllers')
const deviceController = require('../../controllers/device-controller')

//? Base Route : /v2/worker
//? Base In Domain : api.staff.domain.com/v2/worker/

// Account create
router.post('/new-account', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.createAccount)

// Get all Accounts
router.get('/account/list', verifyToken, verifyOrigin(['ttcr_stfAcc_read', 'ttcr_stfAcc_write']), staffController.getAllStaffs)

// Get single Details
router.get('/initial-info', verifyToken, staffController.getInitialAccountInfo)
router.get('/account/:accId', verifyToken, staffController.getSingeStaffInfo)

// Update Account
router.put('/account/:accId/address', verifyToken, verifyOrigin, staffController.updateWorkerAddress)
router.put('/account/:accId/contact', verifyToken, verifyOrigin, staffController.updateWorkerContact)
router.put('/account/:accId/info', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.adminUpdateWorkerInfo)
router.put('/account/:accId/settings', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.updateSettings)

// Delete Account
router.delete('/account/:accId', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.deleteStaffAccount)

// Device
router.get('/:accId/device', verifyToken, deviceController.getUserDevices)
router.delete('/:accId/device/:dvcId', verifyToken, deviceController.terminateDevice)

//? Worker leave letter api here add

module.exports = router