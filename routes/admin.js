const express = require('express')
const router = express.Router();
const { verifyAdmin } = require('../middleware/verify-middleware')
const adminController = require('../controllers/admin-controllers')
const staffController = require('../controllers/staff-controllers')
const designationController = require('../controllers/designation-controllers')
const workController = require('../controllers/work-controllers')
const staffWorkController = require('../controllers/staff-work-controller')
const qrController = require('../controllers/qr-controller')

// Auth
router.post('/auth/login', adminController.postLogin)

// Designation
router.post('/designation', verifyAdmin, designationController.addDesignation)
router.get('/designations', verifyAdmin, designationController.getDesignations)
router.put('/designation', verifyAdmin, designationController.editDesignation)
router.delete('/designation', verifyAdmin, designationController.deleteDesignation)

// Work
router.get('/regular-work', verifyAdmin, workController.getAllWorksForUser)
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
router.get('/staff/all-list', verifyAdmin, staffController.getAllStaffs);
router.get('/staff/:staffId', verifyAdmin, staffController.getOneStaff)
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


// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router