const express = require('express')
const router = express.Router();
const { verifyUser } = require('../middleware/verify-middleware')
const userController = require('../controllers/staff-controllers')
const designationController = require('../controllers/designation-controllers')
const workController = require('../controllers/work-controllers')
const staffWorkController = require('../controllers/staff-work-controller')

// Auth
router.post('/sign-up', userController.doSignUp)
router.post('/login', userController.doLogin)

// Designation
router.get('/designations', designationController.getDesignations)

// Work
router.get('/punch-details', verifyUser, staffWorkController.getLatestPunchDetails)
router.post('/punch-in', verifyUser, staffWorkController.doPunchIn)
router.post('/punch-out', verifyUser, staffWorkController.doPunchOut)
router.post('/start-break', verifyUser, staffWorkController.doStartBreak)
router.post('/end-break', verifyUser, staffWorkController.doEndBreak)
router.get('/works/:designation', verifyUser, workController.getAllWorksForUser)
router.post('/regular-work', verifyUser, staffWorkController.doRegularWork)
router.post('/extra-work', verifyUser, staffWorkController.doExtraWork)
router.post('/start-lunch-break', verifyUser, staffWorkController.doStartLunchBreak)
router.post('/end-lunch-break', verifyUser, staffWorkController.doEndLunchBreak)
router.post('/start-over-time', verifyUser, staffWorkController.doStartOverTime)
router.post('/stop-over-time', verifyUser, staffWorkController.doStopOverTime)

// offline
router.post('/offline-recollect', verifyUser, staffWorkController.doOfflineRecollection)

// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router