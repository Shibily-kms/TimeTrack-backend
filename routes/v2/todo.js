const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../middleware/verify-middleware')
const workController = require('../../controllers/work-controllers')


// Create New Regular ToDo
router.post('/new', verifyToken, verifyOrigin, workController.addRegularWork)

// staff base todo list
router.get('/list', verifyToken, verifyOrigin, workController.getAllTodoWorks)



module.exports = router