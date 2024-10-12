const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../../middleware/verify-middleware')
const l2Controller = require('../../../controllers/leave-letter-controller')



// Get Leave letters
router.get('/leaves', verifyToken, verifyOrigin(['ttcr_l2_write', 'ttcr_l2_read']), l2Controller.leaveLetterListAdmin)
router.get('/staff/total-leave', verifyToken, verifyOrigin(['ttcr_l2_read', 'ttcr_l2_write']), l2Controller.totalMonthLeave)


// Actions
router.put('/action/approve', verifyToken, verifyOrigin(['ttcr_l2_write']), l2Controller.approveLeaveApplication)
router.put('/action/reject', verifyToken, verifyOrigin(['ttcr_l2_write']), l2Controller.rejectLeaveApplication)
router.delete('/action/cancel', verifyToken, verifyOrigin(['ttcr_l2_write']), l2Controller.cancelLeaveApplicationAdmin)


// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});

module.exports = router