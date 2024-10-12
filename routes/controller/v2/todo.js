const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../../middleware/verify-middleware')
const todoController = require('../../../controllers/todo-controller')


// Create New Regular ToDo
router.post('/task', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), todoController.createTodoAdmin)

// Update ToDo
router.put('/task/:taskId', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), todoController.updateTodoAdmin)

// Get data
router.get('/task', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), todoController.getUpdateTask)
router.get('/task/completed', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), todoController.getCompletedTask)


// Actions
router.delete('/task/erase', verifyToken, verifyOrigin(['ttcr_stfAcc_write']), todoController.eraseTaskAdmin)


// catch 404 and forward to error handler
router.use((req, res, next) => {
    const error = new Error('URL not found');
    error.statusCode = 404;
    next(error);
});

module.exports = router