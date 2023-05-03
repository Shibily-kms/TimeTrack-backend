const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema(
    {
        designation: {
            type: String,
            required: true
        },
        name: []
    },
    {
        timestamps: true
    })

const DesignationModel = mongoose.model('existing_designation', designationSchema)
module.exports = DesignationModel