const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
    {
        otp_v: {
            password: {
                type: String
            },
            otp_createdAt: {
                type: Date
            },
            otp_expireAt: {
                type: Date
            },
            send_attempt: {
                type: Number
            },
            verify_attempt: {
                type: Number
            }
        },
        primary_contact: {
            country_code: {
                type: String
            },
            number: {
                type: String
            },
            sms: {
                type: Boolean
            }
        }
    },
    {
        timestamps: true
    })

const AccountModel = mongoose.model('user_account', accountSchema)
module.exports = AccountModel