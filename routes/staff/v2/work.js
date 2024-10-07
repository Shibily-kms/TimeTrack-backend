const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../../middleware/verify-middleware')
const workController = require('../../../controllers/staff-work-controller')
const staffWorkController = require('../../../controllers/staff-work-controller')

//? Base Route : /s/v2/work
//? Base In Domain : api.staff.domain.com/s/v2/work/

router.put('/punch', verifyToken, verifyOrigin(['ttcr_anlz_write']), workController.changeWorkTime)


// Report Salary
router.get('/report/salary', verifyToken, verifyOrigin(['ttcr_rprt_read', 'ttcr_rprt_write']), staffWorkController.monthlyWorkReport)
router.get('/report/salary/monthly', verifyToken, staffWorkController.getSingleSalaryReport) //User

// Report Work
router.get('/report/punch', verifyToken, staffWorkController.analyzeWorkData) //User

// Calendar
router.get('/report/semi-calender/days', verifyToken, staffWorkController.getStaffDayInfoForCalendar) // User



module.exports = router