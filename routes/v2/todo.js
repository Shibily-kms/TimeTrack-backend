const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../middleware/verify-middleware')
const todoController = require('../../controllers/todo-controller')


// Create New Regular ToDo
router.post('/task', verifyToken, todoController.createTodo)

// Update ToDo
router.put('/task/:taskId', verifyToken, todoController.updateTodo)

// Delete ToDo
router.delete('/task/:taskId', verifyToken, todoController.deleteTask)

// Get data
router.get('/task', verifyToken, todoController.getUpdateTask)

// Actions
router.post('/task/do', verifyToken, todoController.doTask)



module.exports = router