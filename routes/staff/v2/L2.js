const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middleware/verify-middleware')
const l2Controller = require('../../../controllers/leave-letter-controller')


// Apply leave
router.post('/apply', verifyToken, l2Controller.applyLeave)

// Get Leave letters
router.get('/leaves', verifyToken, l2Controller.leaveLetterList)
router.get('/staff/total-leave', verifyToken, l2Controller.totalMonthLeave)  

// Actions
router.delete('/action/cancel', verifyToken, l2Controller.cancelLeaveApplication)



// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});


module.exports = router