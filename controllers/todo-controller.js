const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { successResponse, errorResponse } = require('../helpers/response-helper')
const TodoModel = require('../models/todo_model')
const { nextTodoTaskDate } = require('../helpers/todo-helpers');


// Create Todo
const createTodo = async (req, res, next) => {
    try {
        const { title } = req.body
        const assigned_to = req.user.acc_id

        if (!title) {
            res.status(404).json(errorResponse('Title is required'))
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

        res.status(201).json(successResponse('Created', updateTask, 201))
    } catch (error) {
        next(error)
    }
}

const createTodoAdmin = async (req, res, next) => {
    try {
        const { title } = req.body
        const assigned_to = req.body.staff_id

        if (!title) {
            res.status(404).json(errorResponse('Title is required'))
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

        res.status(201).json(successResponse('Created', updateTask, 201))
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
            res.status(404).json(errorResponse('Title is required'))
            return;
        }

        // Find task
        const task = await TodoModel.findOne({ _id: new ObjectId(task_id), deleted_by: { $in: [null, undefined] } })

        if (req.user.acc_id != task._doc.created_by.toString()) {
            return res.status(404).json(errorResponse('Task authorization failed', 404))
        }

        // task Build
        let { due_date, is_daily } = nextTodoTaskDate(req.body.frequency, req.body.periods, req.body.start_date, req.body.start_time)

        // Update
        const updateTask = await TodoModel.findOneAndUpdate({ _id: new ObjectId(task_id) }, {
            $set: {
                title: title,
                content: req.body.content || null,
                priority: req.body.priority || 0,
                periods: req.body.periods || [],
                interval: req.body.frequency ? 1 : 0,
                due_date: due_date,
                is_daily: is_daily,
                frequency: req.body.frequency || 0,
                repeat_first_date: req.body.frequency ? (task._doc.repeat_first_date || due_date) : null,
            }
        }, { new: true })


        if (!updateTask) {
            res.status(404).json(errorResponse('invalid task Id', 404))
            return;
        }

        res.status(201).json(successResponse('Updated', updateTask, 201))

    } catch (error) {
        next(error)
    }
}

const updateTodoAdmin = async (req, res, next) => {
    try {
        const { title } = req.body
        const task_id = req.params.taskId

        if (!title) {
            res.status(404).json(errorResponse('Title is required'))
            return;
        }

        // Find task
        const task = await TodoModel.findOne({ _id: new ObjectId(task_id), deleted_by: { $in: [null, undefined] } })

        if (req.user.acc_id != task._doc.created_by.toString()) {
            return res.status(404).json(errorResponse('Task authorization failed', 404))
        }

        // task Build
        let { due_date, is_daily } = nextTodoTaskDate(req.body.frequency, req.body.periods, req.body.start_date, req.body.start_time)

        // Update
        const updateTask = await TodoModel.findOneAndUpdate({ _id: new ObjectId(task_id) }, {
            $set: {
                title: title,
                content: req.body.content || null,
                priority: req.body.priority || 0,
                periods: req.body.periods || [],
                interval: req.body.frequency ? 1 : 0,
                due_date: due_date,
                is_daily: is_daily,
                frequency: req.body.frequency || 0,
                repeat_first_date: req.body.frequency ? (task._doc.repeat_first_date || due_date) : null,
            }
        }, { new: true })


        if (!updateTask) {
            res.status(404).json(errorResponse('invalid task Id', 404))
            return;
        }

        res.status(201).json(successResponse('Updated', updateTask, 201))

    } catch (error) {
        next(error)
    }
}

// Get Todo
const getUpdateTask = async (req, res, next) => {
    try {
        const { to_date } = req.query
        const acc_id = req.query.staff_id || req.user.acc_id

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
                    deleted_by: { $in: [null, undefined] },
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

const getCompletedTask = async (req, res, next) => {
    try {
        const { from_date, to_date } = req.query
        const acc_id = req.query.staff_id || req.user.acc_id

        const allTask = await TodoModel.aggregate([
            {
                $match: {
                    assigned_to: new ObjectId(acc_id),
                    action_date: {
                        $gte: new Date(new Date(from_date).setHours(0, 0, 0, 0)),
                        $lte: new Date(new Date(to_date).setHours(23, 59, 59, 999)),
                    },
                    deleted_by: { $in: [null, undefined] },
                    status: { $in: [-1, 2] }
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
                    created_by: 1,
                    action_date: 1

                }
            },
            {
                $sort: {
                    action_date: 1
                }
            }

        ])

        let completed = allTask.filter(task => task.status === 2);
        let wontDo = allTask.filter(task => task.status === -1);

        res.status(201).json(successResponse('Todo completed list', { completed, wontDo }))

    } catch (error) {
        next(error)
    }
}

const getRemovedTask = async (req, res, next) => {
    try {

        const acc_id = req.user.acc_id

        const allTask = await TodoModel.aggregate([
            {
                $match: {
                    deleted_by: new ObjectId(acc_id)
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
                    created_by: 1,
                    action_date: 1,
                    deleted_at: 1,
                    deleted_by: 1,

                }
            },
            {
                $sort: {
                    deleted_at: 1
                }
            }
        ])

        res.status(201).json(successResponse('Todo removed list', allTask))

    } catch (error) {
        next(error)
    }
}

// Do Task
const doTask = async (req, res, next) => {
    try {
        const { task_id } = req.body
        const acc_id = req.user.acc_id

        const task = await TodoModel.findOne({
            _id: new ObjectId(task_id),
            assigned_to: new ObjectId(acc_id),
            deleted_by: { $in: [null, undefined] }
        })

        if (!task) {
            return res.status(404).json(errorResponse('Invalid task id', 404))
        }

        if (req.user.acc_id != task._doc.created_by.toString()) {
            return res.status(404).json(errorResponse('Task authorization failed', 404))
        }

        // Do work
        await TodoModel.updateOne({ _id: new ObjectId(task_id) }, {
            $set: {
                frequency: 0,
                interval: 0,
                periods: [],
                action_date: new Date(),
                action_by: new ObjectId(acc_id),
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
                repeat_first_date: task?._doc?.repeat_first_date ? new Date(task._doc.repeat_first_date) : new Date(task._doc.due_date),
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

// Undo Task
const undoTask = async (req, res, next) => {
    try {
        const { task_id } = req.body
        const acc_id = req.user.acc_id

        const task = await TodoModel.findOne({
            _id: new ObjectId(task_id),
            assigned_to: new ObjectId(acc_id),
            deleted_by: { $in: [null, undefined] }
        })

        if (![-1, 2].includes(task._doc.status)) {
            return res.status(404).json(errorResponse('This task not completed', 404))
        }

        if (req.user.acc_id != task._doc.created_by.toString()) {
            return res.status(404).json(errorResponse('Task authorization failed', 404))
        }

        // unDo work
        await TodoModel.updateOne({ _id: new ObjectId(task_id) }, {
            $set: {
                action_date: null,
                action_by: undefined,
                status: 1
            }
        })

        res.status(201).json(successResponse('Undo task'))

    } catch (error) {
        next(error)
    }
}

// Won't do
const wontDoTask = async (req, res, next) => {
    try {
        const { task_id } = req.body
        const acc_id = req.user.acc_id

        const task = await TodoModel.findOne({
            _id: new ObjectId(task_id),
            assigned_to: new ObjectId(acc_id),
            deleted_by: { $in: [null, undefined] }
        })

        if (!task) {
            return res.status(404).json(errorResponse('Invalid task id', 404))
        }

        if (req.user.acc_id != task._doc.created_by.toString()) {
            return res.status(404).json(errorResponse('Task authorization failed', 404))
        }

        // Won't do
        await TodoModel.updateOne({ _id: new ObjectId(task_id) }, {
            $set: {
                frequency: 0,
                interval: 0,
                periods: [],
                action_date: new Date(),
                action_by: new ObjectId(acc_id),
                status: -1
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
                repeat_first_date: task?._doc?.repeat_first_date ? new Date(task._doc.repeat_first_date) : new Date(task._doc.due_date),
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

// Remove Task : Soft deletion
const removeTask = async (req, res, next) => {
    try {
        const { taskId } = req.params
        const acc_id = req.user.acc_id

        const task = await TodoModel.findOne({
            _id: new ObjectId(taskId),
            assigned_to: new ObjectId(acc_id),
            deleted_by: { $in: [null, undefined] }
        })

        if (!task) {
            return res.status(404).json(errorResponse('Invalid task id', 404))
        }

        if (req.user.acc_id != task._doc.created_by.toString()) {
            return res.status(404).json(errorResponse('Task authorization failed', 404))
        }

        // unDo work
        await TodoModel.updateOne({ _id: new ObjectId(taskId) }, {
            $set: {
                deleted_at: new Date(),
                deleted_by: new ObjectId(acc_id)
            }
        })

        res.status(201).json(successResponse('remove task'))

    } catch (error) {
        next(error)
    }
}

// Restore 
const restoreTask = async (req, res, next) => {
    try {
        const { task_id } = req.body
        const acc_id = req.user.acc_id

        const task = await TodoModel.findOne({
            _id: new ObjectId(task_id),
            deleted_by: new ObjectId(acc_id)
        })

        if (req.user.acc_id != task._doc.created_by.toString()) {
            return res.status(404).json(errorResponse('Task authorization failed', 404))
        }

        // restore task
        await TodoModel.updateOne({ _id: new ObjectId(task_id) }, {
            $set: {
                deleted_at: null,
                deleted_by: null
            }
        })

        res.status(201).json(successResponse('Restore task'))

    } catch (error) {
        next(error)
    }
}

// Erase Task : Hard deletion
const eraseTask = async (req, res, next) => {
    try {
        const { task_id } = req.query
        const acc_id = req.user.acc_id

        // If task id
        if (task_id) {
            const task = await TodoModel.findOne({
                _id: new ObjectId(task_id),
                deleted_by: new ObjectId(acc_id)
            })

            if (!task) {
                return res.status(404).json(errorResponse('Invalid task id', 404))
            }

            if (req.user.acc_id != task._doc.created_by.toString()) {
                return res.status(404).json(errorResponse('Task authorization failed', 404))
            }
            await TodoModel.deleteOne({ _id: new ObjectId(task_id) })

            return res.status(201).json(successResponse('Erase task'))

        } else {
            // Erase All 
            await TodoModel.deleteMany({ deleted_by: new ObjectId(acc_id) })

            return res.status(201).json(successResponse('Erase all task'))
        }


    } catch (error) {
        next(error)
    }
}

const eraseTaskAdmin = async (req, res, next) => {

    try {
        const { task_id } = req.query
        const acc_id = req.user.acc_id

        if (!task_id) {
            return res.status(404).json(errorResponse('task_id is required'))
        }

        const task = await TodoModel.findOne({
            _id: new ObjectId(task_id)
        })

        if (!task) {
            return res.status(404).json(errorResponse('Invalid task id', 404))
        }

        await TodoModel.deleteOne({ _id: new ObjectId(task_id) })

        return res.status(201).json(successResponse('Erase task'))

    } catch (error) {
        next(error)
    }
}




module.exports = {
    createTodo, updateTodo, getUpdateTask, doTask, getCompletedTask, undoTask, wontDoTask,
    removeTask, getRemovedTask, restoreTask, eraseTask, createTodoAdmin, updateTodoAdmin,
    eraseTaskAdmin
}
