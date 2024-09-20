const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../middleware/verify-middleware')
const l2Controller = require('../../controllers/leave-letter-controller')


// Apply leave
router.post('/apply', verifyToken, l2Controller.applyLeave)

// Get Leave letters
// router.get('/leaves', verifyToken, verifyOrigin, l2Controller.leaveLetterList)




module.exports = router