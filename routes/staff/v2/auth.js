const express = require('express');
const router = express.Router();
const smsController = require('../../../controllers/sms-controller.js')
const authController = require('../../../controllers/auth-controller.js')
const { verifyToken } = require('../../../middleware/verify-middleware.js')

//? Base Route : /s/v2/auth
//? Base In Domain : api.staff.domain.com/s/v2/auth/


// Send Otp
router.post('/otp-v/send', smsController.sendOtp)

// Verify Otp
router.post('/otp-v/verify', smsController.verifyOtp)

// Reset Password
router.post('/reset-text-password', authController.resetTextPassword)
router.post('/change-text-password', verifyToken, authController.changeTextPassword)

// Token Generate
router.post('/take-token', authController.generateToken)

// Rotate Token
router.post('/rotate-token', authController.rotateToken)


// Account sign in 
router.post('/account-sign-in', authController.doSignIn)


// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});


module.exports = router