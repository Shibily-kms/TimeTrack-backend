const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../../middleware/verify-middleware')
const workController = require('../../../controllers/staff-work-controller')
const staffWorkController = require('../../../controllers/staff-work-controller')

//? Base Route : /c/v2/work
//? Base In Domain : api.staff.domain.com/c/v2/work/



// Report Work
router.get('/report/punch', verifyToken, verifyOrigin(['ttcr_anlz_write', 'ttcr_anlz_read']), staffWorkController.analyzeWorkData) 



router.put('/punch', verifyToken, verifyOrigin(['ttcr_anlz_write']), workController.changeWorkTime)
router.get('/report/salary', verifyToken, verifyOrigin(['ttcr_rprt_read', 'ttcr_rprt_write']), staffWorkController.monthlyWorkReport)

// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});

module.exports = router