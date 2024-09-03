const express = require('express')
const router = express.Router();
const { verifyUser } = require('../middleware/verify-middleware')
const staffController = require('../controllers/staff-controllers')
const designationController = require('../controllers/designation-controllers')
const workController = require('../controllers/work-controllers')
const staffWorkController = require('../controllers/staff-work-controller')
const l2Controller = require('../controllers/leave-letter-controller.js')
const smsController = require('../controllers/sms-controller.js')

// Auth
router.post('/auth/login', staffController.doLogin)
router.get('/auth/check-active', verifyUser, staffController.checkUserActive)
router.post('/auth/otp-v/send', smsController.sendOtp)
router.post('/auth/otp-v/verify', smsController.verifyOtp)
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

// Report
router.get('/analyze/staff-work-data', verifyUser, staffWorkController.analyzeWorkData)
router.get('/analyze/salary-report/single', verifyUser, staffWorkController.getSingleSalaryReport)

// For Calendar
router.get('/analyze/calendar/staff-work-data', verifyUser, staffWorkController.getAnalyzeWorkDataForCalendar)

// offline
router.post('/offline-recollect', verifyUser, staffWorkController.doOfflineRecollection)

// Settings
router.post('/change-password', verifyUser, staffController.changePassword)
router.post('/new-password', staffController.newPassword)

// Leave letter
router.get('/leave-application', verifyUser, l2Controller.getAllForUser)
router.post('/leave-application', verifyUser, l2Controller.registerLeave)
router.delete('/leave-application/cancel', verifyUser, l2Controller.cancelLeaveApplication)
router.get("/leave-application/total-leave", verifyUser, l2Controller.totalMonthLeave)




// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router