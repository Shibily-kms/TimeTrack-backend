const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../middleware/verify-middleware')
const todoController = require('../../controllers/todo-controller')


// Create New Regular ToDo
router.post('/task', verifyToken, todoController.createTodo)

// Update ToDo
router.put('/task/:taskId', verifyToken, todoController.updateTodo)

// Get data
router.get('/task', verifyToken, todoController.getUpdateTask)
router.get('/task/completed', verifyToken, todoController.getCompletedTask)

// Actions
router.post('/task/do', verifyToken, todoController.doTask)
router.post('/task/undo', verifyToken, todoController.undoTask)
router.post('/task/wont-do', verifyToken, todoController.wontDoTask)
router.delete('/task/:taskId', verifyToken, todoController.removeTask)



module.exports = router