const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
    {
        sid: {
            type: String
        },
        first_name: {
            type: String,
            required: true
        },
        last_name: {
            type: String,
            required: true
        },
        user_name: {
            type: String
        },
        gender: {
            type: String
        },
        email_id: {
            type: String,
            required: true
        },
        contact1: {
            type: String,
            required: true
        },
        contact2: {
            type: String
        },
        whatsapp: {
            type: String
        },
        address: {
            address: {
                type: String
            },
            place: {
                type: String
            },
            post: {
                type: String
            },
            pin_code: {
                type: String,
            },
            district: {
                type: String
            },
            state: {
                type: String
            }
        },
        designation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'existing_designation',
            required: true
        },
        dob: {
            type: String,
            required: true
        },
        current_salary: Number,
        current_working_days: Number,
        current_working_time: Number,
        balance_CF: Number,
        join_date: String,
        resign_date: String,
        punch_type: {
            type: String,
            default: 'software'
        },
        auto_punch_out: String,
        origins_list: [],
        password: {
            type: String,
            required: true
        },
        delete: {
            type: Boolean,
            default: false
        },
        deleteReason: {
            date: Date,
            status: String,
            reason: String
        },
    },
    {
        timestamps: true
    })

const StaffModel = mongoose.model('staff_data', staffSchema)
module.exports = StaffModel