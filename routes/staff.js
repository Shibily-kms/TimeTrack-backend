const express = require('express')
const router = express.Router();
const { verifyUser, verifyToken } = require('../middleware/verify-middleware')
const staffController = require('../controllers/staff-controllers')
const designationController = require('../controllers/designation-controllers')
const workController = require('../controllers/work-controllers')
const staffWorkController = require('../controllers/staff-work-controller')
const l2Controller = require('../controllers/leave-letter-controller.js')
const smsController = require('../controllers/sms-controller.js')

// Auth

router.get('/auth/check-active', verifyUser, staffController.checkUserActive)  // ! delete
router.post('/auth/otp-v/send', smsController.sendOtp)   //! move to v2/auth
router.post('/auth/otp-v/verify', smsController.verifyOtp)   //! move to v2/auth
// router.get('/profile', staffController.getOneStaff)      //! delete
router.put('/profile', staffController.updateProfile)

// Designation
router.get('/designations', designationController.getDesignations)

// Entry to Work
router.get('/punch/today-data', verifyToken, staffWorkController.getLatestPunchDetails)
router.post('/punch/in', verifyToken, staffWorkController.inToWork)
router.post('/punch/out', verifyToken, staffWorkController.outFromWork)
router.post('/punch/by-qr', verifyToken, staffWorkController.punchWithQrCode)

// Todo-work
// router.get('/regular-work', verifyToken, workController.getAllWorksForUser);    // !move to todo
router.post('/regular-work', verifyUser, workController.addRegularWork);        //! move to todo
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
// router.post('/change-password', verifyUser, staffController.changePassword)  //! move to v2/auth
router.post('/new-password', staffController.newPassword)   //! move to v2/auth

// Leave letter
router.get('/leave-application', verifyUser, l2Controller.getAllForUser)
// router.post('/leave-application', verifyUser, l2Controller.registerLeave)   //! move to v2/l2
router.delete('/leave-application/cancel', verifyUser, l2Controller.cancelLeaveApplication)
router.get("/leave-application/total-leave", verifyUser, l2Controller.totalMonthLeave)




// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router