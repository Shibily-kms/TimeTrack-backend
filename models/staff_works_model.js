const mongoose = require('mongoose')

const staffWorksSchema = new mongoose.Schema(
    {
        name: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'staff_data',
            required: true
        },
        date: {
            type: String
        },
        designation: String,
        regular_work: [
            {
                work: String,
                start: Date,
                end: Date,
                duration: Number
            }
        ],
        extra_work: [
            {
                work: String,
                start: Date,
                end: Date,
                duration: Number
            }
        ],
        punch_list: [
            {
                in: Date,
                out: Date,
                in_by: String,
                out_by: String,
                auto: Boolean,
            }
        ],
        last_edit_time: Date

    },
    {
        timestamps: true
    })

const StaffWorksModel = mongoose.model('staff_works_detail', staffWorksSchema)
module.exports = StaffWorksModel