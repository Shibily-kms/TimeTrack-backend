const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../../middleware/verify-middleware')
const staffController = require('../../../controllers/staff-controllers')

// Account create
router.post('/new-account', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.createAccount)

// Get all Accounts
router.get('/account/list', verifyToken, verifyOrigin([
    'ttcr_stfAcc_read', 'ttcr_stfAcc_write', 'ttcr_anlz_read', 'ttcr_anlz_write', 'ttcr_rprt_read', 'ttcr_rprt_write'
]), staffController.getAllStaffs)
router.get('/initial-info', verifyToken, verifyOrigin(['ttcr_stfAcc_read', 'ttcr_stfAcc_write']), staffController.getInitialAccountInfo)
router.get('/account/:accId', verifyToken, verifyOrigin(['ttcr_stfAcc_read', 'ttcr_stfAcc_write']), staffController.getSingeStaffInfo)
router.get('/account/:accId/profile-status', verifyToken, staffController.getProfileDataVerification)


// Common Update
router.put('/profile/common-data', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.updateWorkerCommonData)

// Update Profile
router.put('/account/:accId/info', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.adminUpdateWorkerInfo)
router.put('/account/:accId/settings', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.updateSettings)

// Delete Account
router.delete('/account/:accId', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.deleteStaffAccount)

// Pro account
router.post('/pro-account', verifyToken, verifyOrigin(['dvur_backup_read']), staffController.verifyAndAddProAccount)
router.get('/pro-account/list', verifyToken, verifyOrigin(['dvur_backup_read']), staffController.getAllProAccounts)
router.delete('/pro-account/deactivate', verifyToken, verifyOrigin(['dvur_backup_read']), staffController.deactivateProAccount)


// Software origins
router.get('/software-origins/:origin_id/list', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), staffController.getStaffListOriginBase)


// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});

module.exports = router