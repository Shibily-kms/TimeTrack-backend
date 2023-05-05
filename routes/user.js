const express = require('express')
const router = express.Router();
const { verifyUser } = require('../middlewares/verify-middleware')

router.get('/', (req, res) => {
    res.send('user')
})

// Auth
const { doSignUp, doLogin } = require('../controllers/user-controllers')
router.post('/sign-up', doSignUp)
router.post('/login', doLogin)


// Designation
const { allDesignations } = require('../controllers/designation-controllers')
router.get('/designations', allDesignations)

// Work
const {
    getLatestPunchDetails, doPunchIn, doPunchOut, doStartBreak, doEndBreak, doRegularWork, doExtraWork
} = require('../controllers/staff-work-controller')
const { getAllWorksForUser } = require('../controllers/work-controllers')

router.get('/punch-details', verifyUser, getLatestPunchDetails)
router.post('/punch-in', verifyUser, doPunchIn)
router.post('/punch-out', verifyUser, doPunchOut)
router.post('/start-break', verifyUser, doStartBreak)
router.post('/end-break', verifyUser, doEndBreak)
router.get('/works/:designation', verifyUser, getAllWorksForUser)
router.post('/regular-work', verifyUser, doRegularWork)
router.post('/extra-work', verifyUser, doExtraWork)

module.exports = router