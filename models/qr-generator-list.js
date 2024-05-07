const mongoose = require('mongoose');

const qrSchema = new mongoose.Schema(
    {
        qrId: {
            type: String,
            require: true
        },
        qr_type: {
            type: String,
            require: true
        },
        name: {
            type: String,
            require: true
        },
        expire_date: {
            type: String,
            require: true
        },
        used_count: {
            type: Number
        },
        last_used: {
            type: Date
        },
        re_direct_url: {
            type: String,
        },
        delete: {
            type: Date
        }
    },
    {
        timestamps: true
    })

const QrGenModel = mongoose.model('qr_generator_list', qrSchema, 'qr_generator_list')
module.exports = QrGenModel