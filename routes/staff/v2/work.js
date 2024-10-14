const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middleware/verify-middleware')
const staffWorkController = require('../../../controllers/staff-work-controller')

//? Base Route : /s/v2/work
//? Base In Domain : api.staff.domain.com/s/v2/work/

// Entry to work
router.get('/punch/today-data', verifyToken, staffWorkController.getLatestPunchDetails)
router.post('/punch/in', verifyToken, staffWorkController.inToWork)
router.post('/punch/out', verifyToken, staffWorkController.outFromWork)
router.post('/punch/by-qr', verifyToken, staffWorkController.punchWithQrCode)

// Report Salary
router.get('/report/salary/monthly', verifyToken, staffWorkController.getSingleSalaryReport)

// Report Work
router.get('/report/punch', verifyToken, staffWorkController.analyzeWorkData)

// Calendar
router.get('/report/semi-calender/days', verifyToken, staffWorkController.getStaffDayInfoForCalendar) // User




// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});

module.exports = router