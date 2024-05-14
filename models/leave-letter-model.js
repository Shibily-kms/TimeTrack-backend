const mongoose = require('mongoose');

const leaveLetterSchema = new mongoose.Schema(
    {
        token_id: {
            type: String,
            required: true
        },
        staff_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'staff_datas',
            required: true
        },
        leave_status: {
            type: String,
            required: true,
            default: 'Pending'
        },
        reg_date_time: {
            type: Date,
            required: true
        },
        leave_type: {
            type: String,
            required: true
        },
        apply_leave: {
            from_date: {
                type: String,
                required: true
            },
            to_date: {
                type: String,
                required: true
            },
            days: {
                type: Number,
                required: true,
                default: 0
            }
        },
        approved_leave: {
            from_date: {
                type: String
            },
            to_date: {
                type: String,
            },
            days: {
                type: Number
            }
        },
        leave_reason: {
            type: String,
            required: true
        },
        comment: {
            type: String
        },
        approved_date_time: {
            type: Date
        },
        rejected_date_time: {
            type: Date
        },
        cancelled_date_time: {
            type: Date
        },
        self_cancel: {
            type: Boolean
        }

    },
    {
        timestamps: true
    })

const LeaveAppModel = mongoose.model('leave_application_list', leaveLetterSchema, 'leave_application_list')
module.exports = LeaveAppModel