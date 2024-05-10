const express = require('express')
const router = express.Router();
const { verifyUser } = require('../middleware/verify-middleware')
const staffController = require('../controllers/staff-controllers')
const designationController = require('../controllers/designation-controllers')
const workController = require('../controllers/work-controllers')
const staffWorkController = require('../controllers/staff-work-controller')

// Auth
router.post('/auth/login', staffController.doLogin)
router.get('/auth/check-active', verifyUser, staffController.checkUserActive)
router.get('/profile', staffController.getOneStaff)
router.put('/profile', staffController.updateProfile)

// Designation
router.get('/designations', designationController.getDesignations)

// Entry to Work
router.get('/punch/today-data', verifyUser, staffWorkController.getLatestPunchDetails)
router.post('/punch/in', verifyUser, staffWorkController.inToWork)
router.post('/punch/out', verifyUser, staffWorkController.outFromWork)
router.post('/punch/by-qr', verifyUser, staffWorkController.punchWithQrCode)

// Todo-work
router.get('/regular-work', verifyUser, workController.getAllWorksForUser);
router.post('/regular-work', verifyUser, workController.addRegularWork);
router.put('/regular-work', verifyUser, workController.editRegularWork);
router.delete('/regular-work', verifyUser, workController.deleteRegularWork);
router.get('/regular-work/:punch_id/do', verifyUser, workController.doRegularWork)
router.post('/extra-work/do', verifyUser, staffWorkController.doExtraWork)

// offline
router.post('/offline-recollect', verifyUser, staffWorkController.doOfflineRecollection)

// Settings
router.post('/change-password', verifyUser, staffController.changePassword)

// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router