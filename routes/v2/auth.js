const express = require('express');
const router = express.Router();
const smsController = require('../../controllers/sms-controller.js')
const staffController = require('../../controllers/staff-controllers')
const authController = require('../../controllers/auth-controller.js')

//? Base Route : /v2/auth
//? Base In Domain : api.staff.domain.com/v2/auth/


// Send Otp
router.post('/otp-v/send', smsController.sendOtp)
// Verify Otp
router.post('/otp-v/verify', smsController.verifyOtp)
// Reset Password
router.post('/reset-password', staffController.newPassword)


// Token Generate
router.post('/take-token', authController.generateToken)
// Rotate Token
router.post('/rotate-token', authController.rotateToken)


// Account sign in 
router.post('/account-sign-in', authController.doSignIn)


module.exports = router