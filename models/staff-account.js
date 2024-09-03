const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
    {
        acc_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'staff_data',
            required: true
        },
        primary_number: {
            country_code: {
                type: String
            },
            number: {
                type: String
            },
            sms: {
                type: Boolean
            },
            verified: {
                type: Boolean
            }
        },
        email_address: {
            mail: {
                type: String
            },
            verified: {
                type: Boolean
            }
        },
        // origins_list: [],
        text_password: {
            type: String,
            required: true
        },
        last_tp_changed: {
            type: Date
        },
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
        two_step_auth: {
            mobile_number: {
                country_code: {
                    type: String
                },
                number: {
                    type: String
                },
                verified: {
                    type: Boolean
                }
            }
        },
        dropped_account: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    })

const StaffAccountModel = mongoose.model('staff_account', staffSchema)
module.exports = StaffAccountModel