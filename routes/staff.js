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

// Designation
router.get('/designations', designationController.getDesignations)



// offline
router.post('/offline-recollect', verifyUser, staffWorkController.doOfflineRecollection)

// Settings



// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router