const mongoose = require('mongoose');

const workSchema = new mongoose.Schema(
    {
        designation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'existing_designations',
            required: true,
            unique: true
        },
        works: [
            {
                type: String,
            }
        ]
    },
    {
        timestamps: true
    })

const WorkModel = mongoose.model('works_of_designation', workSchema)
module.exports = WorkModel