const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../../middleware/verify-middleware')
const staffController = require('../../../controllers/staff-controllers')

// Account create
router.post('/new-account', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.createAccount)

// Get all Accounts
router.get('/account/list', verifyToken, verifyOrigin(['ttcr_stfAcc_read', 'ttcr_stfAcc_write']), staffController.getAllStaffs)
router.get('/initial-info', verifyToken, verifyOrigin(['ttcr_stfAcc_read', 'ttcr_stfAcc_write']), staffController.getInitialAccountInfo)
router.get('/account/:accId', verifyToken, verifyOrigin(['ttcr_stfAcc_read', 'ttcr_stfAcc_write']), staffController.getSingeStaffInfo)

// Common Update
router.put('/profile/common-data', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.updateWorkerCommonData)

// Update Profile
router.put('/account/:accId/info', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.adminUpdateWorkerInfo)
router.put('/account/:accId/settings', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.updateSettings)

// Delete Account
router.delete('/account/:accId', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.deleteStaffAccount)



// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});

module.exports = router