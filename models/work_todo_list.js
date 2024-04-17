const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
    {
        owner_type: {
            type: String,
            required: true
        },
        owner_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
          },
        title: {
            type: String,
            required: true
        },
        repeat_type: {
            type: String,
            required: true
        },
        interval: {
            type: Number
        },
        weekly: [{
            type: Number
        }],
        monthly: [{
            type: Number
        }],
        start_date: {
            type: Date,
            required: true
        },
        self_start: {
            type: Boolean
        }
    },
    {
        timestamps: true
    })

const WorkTodoModel = mongoose.model('work_todo_list', todoSchema, 'work_todo_list')
module.exports = WorkTodoModel