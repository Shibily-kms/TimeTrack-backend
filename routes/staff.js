const express = require('express')
const router = express.Router();
const designationController = require('../controllers/designation-controllers')


// Designation
router.get('/designations', designationController.getDesignations)

// offline
// router.post('/offline-recollect', verifyUser, staffWorkController.doOfflineRecollection)

// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});



module.exports = router