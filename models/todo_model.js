const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        content: {
            type: String
        },
        due_date: {
            type: Date
        },
        is_daily: {
            type: Boolean
        },
        action_date: {
            type: Date
        },
        action_by: {
            type: mongoose.Schema.Types.ObjectId
        },
        repeat_first_date: {
            type: Date
        },
        repeat_task_id: {
            type: mongoose.Schema.Types.ObjectId
        },
        frequency: {
            type: Number,      // 0 : null, 1 : Daily , 2 : Weekly,   3 : Monthly
            default: 0
        },
        interval: {
            type: Number
        },
        periods: [
            { type: Number }
        ],
        priority: {
            type: Number,
            default: 0
        },
        status: {
            type: Number,     //  -1 : Won't Do,  0 : Deleted,  1 : Pending , 2 : Completed ,
            default: 1
        },
        tags: [{ type: mongoose.Schema.Types.ObjectId }],
        kind: {
            type: String,
            default: 'TASK'
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId
        },
        assigned_to: {
            type: mongoose.Schema.Types.ObjectId
        },
        deleted_at: {
            type: Date
        },
        deleted_by: {
            type: mongoose.Schema.Types.ObjectId
        },
    },
    {
        timestamps: true
    })

const TodoModel = mongoose.model('todos', todoSchema)
module.exports = TodoModel