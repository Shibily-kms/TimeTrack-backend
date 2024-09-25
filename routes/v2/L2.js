const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../middleware/verify-middleware')
const l2Controller = require('../../controllers/leave-letter-controller')


// Apply leave
router.post('/apply', verifyToken, l2Controller.applyLeave)

// Get Leave letters
router.get('/leaves', verifyToken, verifyOrigin(['ttcr_l2_write', 'ttcr_l2_read']), l2Controller.leaveLetterList)
router.get('/staff/total-leave', verifyToken, verifyOrigin(['ttcr_l2_write']), l2Controller.totalMonthLeave)

// Actions
router.put('/action/approve', verifyToken, verifyOrigin(['ttcr_l2_write']), l2Controller.approveLeaveApplication)
router.put('/action/reject', verifyToken, verifyOrigin(['ttcr_l2_write']), l2Controller.rejectLeaveApplication)
router.delete('/action/cancel', verifyToken, verifyOrigin(['ttcr_l2_write']), l2Controller.cancelLeaveApplication)




module.exports = router