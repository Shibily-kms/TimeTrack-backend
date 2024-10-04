const express = require('express');
const router = express.Router();
const smsController = require('../../controllers/sms-controller.js')
const staffController = require('../../controllers/staff-controllers')
const authController = require('../../controllers/auth-controller.js')
const { verifyToken } = require('../../middleware/verify-middleware')

//? Base Route : /v2/auth
//? Base In Domain : api.staff.domain.com/v2/auth/


// Send Otp
router.post('/otp-v/send', smsController.sendOtp)   // User
// Verify Otp
router.post('/otp-v/verify', smsController.verifyOtp)   // User

// Reset Password
router.post('/reset-text-password', authController.resetTextPassword)  // User
router.post('/change-text-password', verifyToken, authController.changeTextPassword)  // User


// Token Generate
router.post('/take-token', authController.generateToken)   // User
// Rotate Token
router.post('/rotate-token', authController.rotateToken)


// Account sign in 
router.post('/account-sign-in', authController.doSignIn)   // User


module.exports = router