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
        auto_punch_out: Boolean,
        date: {
            type: String
        },
        designation : String,  // New on
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
        over_time: {
            in: Date,
            out: Date,
            auto: Boolean
        }

    },
    {
        timestamps: true
    })

const StaffWorksModel = mongoose.model('staff_works_detail', staffWorksSchema)
module.exports = StaffWorksModel