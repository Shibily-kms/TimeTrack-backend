const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
    {
        sid: {
            type: String
        },
        first_name: {
            type: String,
            required: true
        },
        last_name: {
            type: String,
            required: true
        },
        gender: {
            type: String
        },
        address: {
            address: {
                type: String
            },
            place: {
                type: String
            },
            post: {
                type: String
            },
            pin_code: {
                type: String,
            },
            district: {
                type: String
            },
            state: {
                type: String
            },
            country: {
                type: String
            }
        },
        designation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'existing_designation',
            required: true
        },
        dob: {
            type: String,
            required: true
        },
        current_salary: Number,
        current_working_days: Number,
        current_working_time: Number,
        balance_CF: Number,
        punch_type: {
            type: String,
            default: 'software'
        },
        auto_punch_out: String,
        delete: {
            type: Boolean,
            default: false
        },
        deleteReason: {
            date: Date,
            status: String,
            reason: String
        },

        //? V2 Changes
        //! V2 Delete
        contact2 : {
            type : String
        }, // for delete
        // contact2, whatsapp, origins_list, password, user_name, contact1, email_id


        //* V2 Add
        secondary_number: {
            country_code: {
                type: String
            },
            number: {
                type: String
            },
            sms: {
                type: Date
            },
            verified: {
                type: Date
            }
        },
        official_number: {
            country_code: {
                type: String
            },
            number: {
                type: String
            },
            sms: {
                type: Date
            },
            verified: {
                type: Date
            }
        },
        whatsapp_number: {
            country_code: {
                type: String
            },
            number: {
                type: String
            },
            sms: {
                type: Date
            },
            verified: {
                type: Date
            }
        },
        join_date: {
            type: String
        },
        resign_date: {
            type: String
        }
    },
    {
        timestamps: true
    })

const StaffModel = mongoose.model('staff_data', staffSchema)
module.exports = StaffModel