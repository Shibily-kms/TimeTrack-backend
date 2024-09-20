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
            default: 'Pending'    // 'Pending','Approved','Canceled','Rejected'
        },
        reg_date_time: {
            type: Date,
            required: true
        },
        requested_days: [[String]],   // [date,type,start_time,end_time]
        approved_days: [[String]],   // [date,type,start_time,end_time]
        leave_reason: {
            type: String,
            required: true
        },
        comment: {
            type: String
        },
        action_date_time: {
            type: Date
        },
        action_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'staff_datas',
        },
        self_action: {
            type: Boolean
        }

    },
    {
        timestamps: true
    })

const LeaveAppModel = mongoose.model('leave_application_list', leaveLetterSchema, 'leave_application_list')
module.exports = LeaveAppModel