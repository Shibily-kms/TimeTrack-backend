const express = require('express')
const router = express.Router();
const { verifyAdmin } = require('../middleware/verify-middleware')
const adminController = require('../controllers/admin-controllers')
const staffController = require('../controllers/staff-controllers')
const designationController = require('../controllers/designation-controllers')
const workController = require('../controllers/work-controllers')
const staffWorkController = require('../controllers/staff-work-controller')
const qrController = require('../controllers/qr-controller')
const l2Controller = require('../controllers/leave-letter-controller')
const reportController = require('../controllers/report-controller')

// Auth
router.post('/auth/login', adminController.postLogin)
router.post('/auth/origin-login', adminController.postOriginLogin)

// Designation
router.post('/designation', verifyAdmin, designationController.addDesignation)
router.get('/designations', verifyAdmin, designationController.getDesignations)
router.put('/designation', verifyAdmin, designationController.editDesignation)
router.delete('/designation', verifyAdmin, designationController.deleteDesignation)

// Work
// router.get('/regular-work', verifyAdmin, workController.getAllWorksForUser) //! move to todo
router.post('/regular-work', verifyAdmin, workController.addRegularWork)
router.put('/regular-work', verifyAdmin, workController.editRegularWork)
router.delete('/regular-work', verifyAdmin, workController.deleteRegularWork)
router.get('/analyze/staff-work-data', verifyAdmin, staffWorkController.analyzeWorkData)

// Salary Report
router.get('/analyze/salary-report', verifyAdmin, staffWorkController.monthlyWorkReport)
router.get('/analyze/salary-report/single', verifyAdmin, staffWorkController.getSingleSalaryReport)
router.put('/analyze/salary-report', verifyAdmin, staffWorkController.updateMonthlyWorkReport)

router.put('/work-analyze', verifyAdmin, staffWorkController.changeWorkTime)  // currently disabled

// Staff
router.get('/staff/all-list', staffController.getAllStaffs);
// router.get('/staff/:staffId', verifyAdmin, staffController.getOneStaff)
router.post('/staff', verifyAdmin, staffController.createAccount)
router.put('/staff', verifyAdmin, staffController.adminEditStaff)
router.delete('/staff', verifyAdmin, staffController.deleteStaff)
router.put('/staff/settings', verifyAdmin, staffController.updateSettings)

// Origin
router.get('/access-origins', verifyAdmin, adminController.getAllOrigins)

// QR code generator
router.get('/qr-code', qrController.getSingleQrCode);
router.get('/qr-code/list', verifyAdmin, qrController.getAllQrList);
router.post('/qr-code', verifyAdmin, qrController.createQRCode);
router.delete('/qr-code', verifyAdmin, qrController.deleteQRCode)

// Leave letter
router.get('/leave-application', verifyAdmin, l2Controller.getAllForAdmin)
router.get("/leave-application/total-leave", verifyAdmin, l2Controller.totalMonthLeave)
router.post('/leave-application/approve', verifyAdmin, l2Controller.approveLeaveApplication)
router.post('/leave-application/reject', verifyAdmin, l2Controller.rejectLeaveApplication)
router.delete('/leave-application/cancel', verifyAdmin, l2Controller.cancelLeaveApplication)

// Dashboard
router.get('/report/summery', verifyAdmin, reportController.summeryReport)
router.get('/report/staff-current-status', verifyAdmin, reportController.staffCurrentStatus)
router.get('/report/best-five-staff', verifyAdmin, reportController.bestFiveStaff)
router.get('/report/chart-attendance-report', verifyAdmin, reportController.attendanceReport)


// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router