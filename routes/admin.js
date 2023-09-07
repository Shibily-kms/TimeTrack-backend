const express = require('express')
const router = express.Router();
const { verifyAdmin } = require('../middleware/verify-middleware')
const adminController = require('../controllers/admin-controllers')
const staffController = require('../controllers/staff-controllers')
const designationController = require('../controllers/designation-controllers')
const workController = require('../controllers/work-controllers')
const staffWorkController = require('../controllers/staff-work-controller')

// Auth
router.post('/login', adminController.postLogin)

// Designation
router.post('/designation', verifyAdmin, designationController.addDesignation)
router.get('/designations', verifyAdmin, designationController.getDesignations)
router.put('/designation', verifyAdmin, designationController.editDesignation)
router.delete('/designation', verifyAdmin, designationController.deleteDesignation)

// Work
router.get('/regular-work', verifyAdmin, workController.getAllWorks)
router.post('/regular-work', verifyAdmin, workController.addRegularWork)
router.put('/regular-work', verifyAdmin, workController.editRegularWork)
router.delete('/regular-work', verifyAdmin, workController.deleteRegularWork)
router.get('/analyze/staff-work-data', verifyAdmin, staffWorkController.analyzeWorkData)
router.get('/analyze/work-report', verifyAdmin, staffWorkController.monthlyWorkReport)
router.put('/work-analyze', verifyAdmin, staffWorkController.changeWorkTime)

// Staff
router.get('/staff/all-list', verifyAdmin, staffController.getAllStaffs);
router.get('/staff/:staffId', verifyAdmin, staffController.getOneStaff)
router.post('/staff', verifyAdmin, staffController.createAccount)
router.put('/staff', verifyAdmin, staffController.adminEditStaff)
router.delete('/staff', verifyAdmin, staffController.deleteStaff)

// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router