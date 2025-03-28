const mongoose = require('mongoose')

const staffWorksSchema = new mongoose.Schema(
    {
        name: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'staff_datas',
            required: true
        },
        date: {
            type: String
        },
        designation: String,
        punch_list: [
            {
                in: Date,
                out: Date,
                in_by: String,
                out_by: String,
                auto: Boolean,
            }
        ],
        last_edit_time: Date,
        last_edit_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'staff_datas'
        }

    },
    {
        timestamps: true
    })

const StaffWorksModel = mongoose.model('staff_works_detail', staffWorksSchema)
module.exports = StaffWorksModel