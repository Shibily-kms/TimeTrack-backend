const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
    {
        staff_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'staff_data',
            required: true
        },
        dvc_id: {
            type: String,
            required: true
        },
        acc_type: {
            type: String,
            required: true    // staff, customer
        },
        os: {
            name: { type: String },
            version: { type: String }
        },
        browser: {
            name: { type: String },
            version: { type: String }
        },
        device: {
            vendor: { type: String },
            model: { type: String }
        },
        geo: {
            country: { type: String },
            region: { type: String },
            timezone: { type: String },
            city: { type: String },
            ll: [{ type: String }]
        },
        device_type: { type: String },
        last_login: { type: Date },
        last_active: { type: Date },
        terminated: { type: Date }
    },
    {
        timestamps: true
    })

const DeviceLogModel = mongoose.model('device_log', staffSchema)
module.exports = DeviceLogModel