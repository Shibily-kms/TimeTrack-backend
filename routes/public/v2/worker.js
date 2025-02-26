const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../../middleware/verify-middleware')
const staffController = require('../../../controllers/staff-controllers')


// Get all Accounts
router.get('/account/list', verifyToken, staffController.getAllStaffs)


// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});

module.exports = router