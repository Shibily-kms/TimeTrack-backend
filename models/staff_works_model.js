const mongoose = require('mongoose')

const staffWorksSchema = new mongoose.Schema(
    {
        name: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'staff_data',
            required: true
        },
        punch_in: {
            type: Date,
            required: true
        },
        punch_out: {
            type: Date,
        },
        date: {
            type: String
        },
        regular_work: [
            {
                work: String,
                start: Date,
                end: Date,
                duration: Number
            }
        ],
        break: [
            {
                start: Date,
                end: Date,
                duration: Number
            }
        ],
        lunch_break: {
            start: Date,
            end: Date,
            duration: Number
        }
        ,
        extra_work: [
            {
                work: String,
                start: Date,
                end: Date,
                duration: Number
            }
        ],

    },
    {
        timestamps: true
    })

const StaffWorksModel = mongoose.model('staff_works_detail', staffWorksSchema)
module.exports = StaffWorksModel