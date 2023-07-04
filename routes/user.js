const express = require('express')
const router = express.Router();
const { verifyUser } = require('../middlewares/verify-middleware')
const { doSignUp, doLogin } = require('../controllers/user-controllers')
const { allDesignations } = require('../controllers/designation-controllers')
const { getAllWorksForUser } = require('../controllers/work-controllers')
const { getLatestPunchDetails, doPunchIn, doPunchOut, doStartBreak, doEndBreak, doRegularWork, doExtraWork,
    doOfflineRecollection, doStartLunchBreak, doEndLunchBreak
} = require('../controllers/staff-work-controller')


// Auth
router.post('/sign-up', doSignUp)
router.post('/login', doLogin)

// Designation
router.get('/designations', allDesignations)

// Work
router.get('/punch-details', verifyUser, getLatestPunchDetails)
router.post('/punch-in', verifyUser, doPunchIn)
router.post('/punch-out', verifyUser, doPunchOut)
router.post('/start-break', verifyUser, doStartBreak)
router.post('/end-break', verifyUser, doEndBreak)
router.get('/works/:designation', verifyUser, getAllWorksForUser)
router.post('/regular-work', verifyUser, doRegularWork)
router.post('/extra-work', verifyUser, doExtraWork)
router.post('/start-lunch-break', verifyUser, doStartLunchBreak)
router.post('/end-lunch-break', verifyUser, doEndLunchBreak)

// offline
router.post('/offline-recollect', verifyUser, doOfflineRecollection)




module.exports = router