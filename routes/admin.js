const express = require('express')
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../middleware/verify-middleware')
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
router.post('/designation', verifyToken, designationController.addDesignation)
router.get('/designations', verifyToken, designationController.getDesignations)
router.put('/designation', verifyToken, designationController.editDesignation)
router.delete('/designation', verifyToken, designationController.deleteDesignation)

// Work
// router.get('/regular-work', verifyToken, workController.getAllWorksForUser) //! move to todo
router.post('/regular-work', verifyToken, workController.addRegularWork)
router.put('/regular-work', verifyToken, workController.editRegularWork)
router.delete('/regular-work', verifyToken, workController.deleteRegularWork)
router.get('/analyze/staff-work-data', verifyToken, staffWorkController.analyzeWorkData)

// Salary Report
router.get('/analyze/salary-report', verifyToken, staffWorkController.monthlyWorkReport)
router.get('/analyze/salary-report/single', verifyToken, staffWorkController.getSingleSalaryReport)
router.put('/analyze/salary-report', verifyToken, staffWorkController.updateMonthlyWorkReport)

router.put('/work-analyze', verifyToken, staffWorkController.changeWorkTime)  // currently disabled

// Staff
router.get('/staff/all-list', staffController.getAllStaffs);
// router.get('/staff/:staffId', verifyToken, staffController.getOneStaff)
router.post('/staff', verifyToken, staffController.createAccount)
router.put('/staff', verifyToken, staffController.adminEditStaff)
router.delete('/staff', verifyToken, staffController.deleteStaff)
router.put('/staff/settings', verifyToken, staffController.updateSettings)

// Origin
router.get('/access-origins', verifyToken, adminController.getAllOrigins)

// QR code generator
router.get('/qr-code', qrController.getSingleQrCode);
router.get('/qr-code/list', verifyToken, qrController.getAllQrList);
router.post('/qr-code', verifyToken, qrController.createQRCode);
router.delete('/qr-code', verifyToken, qrController.deleteQRCode)

// Leave letter
router.get('/leave-application', verifyToken, l2Controller.getAllForAdmin)
router.get("/leave-application/total-leave", verifyToken, l2Controller.totalMonthLeave)
router.post('/leave-application/approve', verifyToken, l2Controller.approveLeaveApplication)
router.post('/leave-application/reject', verifyToken, l2Controller.rejectLeaveApplication)
router.delete('/leave-application/cancel', verifyToken, l2Controller.cancelLeaveApplication)

// Dashboard
router.get('/report/summery', verifyToken, verifyOrigin(['ttcr_default']), reportController.summeryReport)
router.get('/report/staff-current-status', verifyToken, verifyOrigin(['ttcr_default']), reportController.staffCurrentStatus)
router.get('/report/best-five-staff', verifyToken, verifyOrigin(['ttcr_default']), reportController.bestFiveStaff)
router.get('/report/chart-attendance-report', verifyToken, verifyOrigin(['ttcr_default']), reportController.attendanceReport)


// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router