const express = require('express')
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../middleware/verify-middleware')
const staffController = require('../controllers/staff-controllers')
const designationController = require('../controllers/designation-controllers')
const qrController = require('../controllers/qr-controller')
const reportController = require('../controllers/report-controller')


// Designation
router.post('/designation', verifyToken, verifyOrigin(['ttcr_pro_write']), designationController.addDesignation)
router.get('/designations', verifyToken, verifyOrigin(['ttcr_pro_write', 'ttcr_pro_read']), designationController.getDesignations)
router.put('/designation', verifyToken, verifyOrigin(['ttcr_pro_write']), designationController.editDesignation)
router.delete('/designation', verifyToken, verifyOrigin(['ttcr_pro_write']), designationController.deleteDesignation)

// Staff
router.get('/staff/all-list', staffController.getAllStaffs);  //! move to v2/worker // for other software

// QR code generator
router.get('/qr-code', qrController.getSingleQrCode);
router.get('/qr-code/list', verifyToken, verifyOrigin(['ttcr_qr_write']), qrController.getAllQrList);
router.post('/qr-code', verifyToken, verifyOrigin(['ttcr_qr_write']), qrController.createQRCode);
router.delete('/qr-code', verifyToken, verifyOrigin(['ttcr_qr_write']), qrController.deleteQRCode)

// Dashboard
router.get('/report/summery', verifyToken, reportController.summeryReport)
router.get('/report/staff-current-status', verifyToken, reportController.staffCurrentStatus)
router.get('/report/best-five-staff', verifyToken, reportController.bestFiveStaff)
router.get('/report/chart-attendance-report', verifyToken, reportController.attendanceReport)


// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router