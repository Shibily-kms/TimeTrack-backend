const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
    {

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
        email_id: {
            type: String,
            required: true
        },
        contact: {
            type: String,
            required: true
        },
        address: {
            place: String,
            pin_code: String
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
        regular_works: [
            {
                work_name: String
            }
        ],
        balance_CF: Number
    },
    {
        timestamps: true
    })

const StaffModel = mongoose.model('staff_data', staffSchema)
module.exports = StaffModel