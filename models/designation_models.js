const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema(
    {
        designation: {
            type: String,
            required: true
        },
        allow_sales: Boolean,
        auto_punch_out : String,
        name: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'users',
            }
        ]
    },
    {
        timestamps: true
    })

const DesignationModel = mongoose.model('existing_designation', designationSchema)
module.exports = DesignationModel