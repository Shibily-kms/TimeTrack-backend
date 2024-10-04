const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { successResponse, errorResponse } = require('../helpers/response-helper')
const TodoModel = require('../models/todo_model')
const { nextTodoTaskDate } = require('../helpers/todo-helpers');
const { YYYYMMDDFormat } = require('../helpers/dateUtils');


// Create Todo
const createTodo = async (req, res, next) => {
    try {
        const { title } = req.body
        const assigned_to = req.user.acc_id

        if (!title) {
            res.status(403).json(errorResponse('Title is required'))
            return;
        }

        // task Build
        let { due_date, is_daily } = nextTodoTaskDate(req.body.frequency, req.body.periods, req.body.start_date, req.body.start_time)

        const task = {
            title: title,
            content: req.body.content || null,
            priority: req.body.priority || 0,
            periods: req.body.periods || undefined,
            interval: req.body.frequency ? 1 : 0,
            due_date: due_date,
            is_daily: is_daily,
            frequency: req.body.frequency || 0,
            repeat_first_date: req.body.frequency ? due_date : null,
            status: 1,
            kind: 'TASK',
            created_by: new ObjectId(req.user.acc_id),
            assigned_to: new ObjectId(assigned_to)
        }

        const updateTask = await TodoModel.create(task)

        res.status(201).json(successResponse('Created', 201, updateTask))
    } catch (error) {
        next(error)
    }
}

// Update Todo
const updateTodo = async (req, res, next) => {
    try {
        const { title } = req.body
        const task_id = req.params.taskId

        if (!title) {
            res.status(403).json(errorResponse('Title is required'))
            return;
        }

        // Find task
        const task = await TodoModel.findOne({ _id: new ObjectId(task_id) })

        if (new ObjectId(req.user.acc_id) !== task._doc.created_by) {
            return res.status(403).json(errorResponse('Task authorization failed', 404))
        }

        // Update
        const updateTask = await TodoModel.updateOne({ _id: new ObjectId(task_id) }, {
            $set: {
                title: title,
                content: req.body.content || null,
                due_date: req.body.due_date || null,
                is_daily: req.body.is_daily || false,
                frequency: req.body.frequency || 0,
                interval: req.body.interval || null,
                periods: req.body.periods || [],
                priority: req.body.priority || 0,
                tags: req.body.tags || [],
                kind: req.body.kind
            }
        })

        if (!updateTask.modifiedCount) {
            res.status(403).json(errorResponse('invalid task Id', 404))
            return;
        }

        res.status(201).json(successResponse('Updated', 201))

    } catch (error) {
        next(error)
    }
}

// Delete Todo
const deleteTask = async (req, res, next) => {
    try {
        const task_id = req.params.taskId

        // Find task
        const task = await TodoModel.findOne({ _id: new ObjectId(task_id) })

        if (new ObjectId(req.user.acc_id) !== task._doc.created_by) {
            return res.status(403).json(errorResponse('Task authorization failed', 404))
        }

        // Deletion
        const removeTask = await TodoModel.deleteOne({ _id: new ObjectId(task_id) })

        if (!removeTask.deletedCount) {
            res.status(403).json(errorResponse('invalid task Id', 404))
            return;
        }

        res.status(201).json(successResponse('Deleted', 201))

    } catch (error) {
        next(error)
    }
}

// Get Todo
const getUpdateTask = async (req, res, next) => {
    try {
        const { to_date } = req.query
        const acc_id = req.user.acc_id

        let matchStage = {}

        if (to_date) {
            matchStage.$or = [
                {
                    due_date: {
                        $lte: new Date(new Date(to_date).setHours(23, 59, 59, 999))
                    }
                },
                {
                    due_date: null // Include documents with null due_date
                }
            ];
        }

        const allTask = await TodoModel.aggregate([
            {
                $match: {
                    assigned_to: new ObjectId(acc_id),
                    status: 1,
                    ...matchStage
                }
            },
            {
                $project: {
                    title: 1,
                    content: 1,
                    due_date: 1,
                    is_daily: 1,
                    repeat_first_date: 1,
                    repeat_task_id: 1,
                    frequency: 1,
                    interval: 1,
                    periods: 1,
                    priority: 1,
                    status: 1,
                    created_by: 1
                }
            },
            {
                $sort: {
                    due_date: 1
                }
            }

        ])

        const today = new Date().setHours(0, 0, 0, 0);

        // Split tasks into overdue and update arrays based on the isOverdue field
        let overdue = allTask.filter(task => new Date(task.due_date).getTime() && new Date(task.due_date).getTime() < today);
        let update = allTask.filter(task => !new Date(task.due_date).getTime() || new Date(task.due_date).getTime() >= today);

        overdue = overdue.map(task => ({ ...task, isOverdue: true }));
        update = update.map(task => ({ ...task, isOverdue: false }));

        res.status(201).json(successResponse('Todo list', { overdue, update }))
    } catch (error) {
        next(error)
    }
}

// Do Task
const doTask = async (req, res, next) => {
    try {
        const { task_id } = req.body
        const acc_id = req.user.acc_id

        const task = await TodoModel.findOne({ _id: new ObjectId(task_id) })

        // Do work
        await TodoModel.updateOne({ _id: new ObjectId(task_id) }, {
            $set: {
                completed_date: new Date(),
                completed_by: new Date(),
                status: 2
            }
        })

        // If repeat , generate next task
        let newTask = null

        if (task._doc.frequency) {
            const nextDate = new Date(new Date(task._doc.due_date).setDate(new Date(task._doc.due_date).getDate() + 1))
            let { due_date, is_daily } = nextTodoTaskDate(
                task._doc.frequency,
                task._doc.periods,
                nextDate,
                task._doc.is_daily ? false : new Date(task._doc.due_date).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
            )

            const taskObj = {
                title: task._doc.title,
                content: task._doc.content || null,
                due_date: due_date,
                is_daily: task._doc.is_daily,
                repeat_first_date: task._doc.repeat_first_date ? new ObjectId(task._doc.repeat_first_date) : new ObjectId(task._doc.due_date),
                repeat_task_id: task._doc.repeat_task_id ? new ObjectId(task._doc.repeat_task_id) : new ObjectId(task._doc._id),
                frequency: task._doc.frequency,
                interval: task._doc.interval,
                periods: task._doc.periods,
                priority: task._doc.priority,
                status: 1,
                kind: task._doc.kind,
                created_by: new ObjectId(task._doc.created_by),
                assigned_to: new ObjectId(task._doc.assigned_to)
            }

            newTask = await TodoModel.create(taskObj)
        }

        res.status(201).json(successResponse('Task completed', newTask))
        
    } catch (error) {
        next(error)
    }
}




module.exports = { createTodo, updateTodo, deleteTask, getUpdateTask, doTask }
