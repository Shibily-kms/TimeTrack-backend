const mongoose = require('mongoose');
const Schema = mongoose.Schema

const adminSchema = new mongoose.Schema(
    {
        access_key: {
            type: String,
            require: true,
            validate: {
                validator: (key) => {
                    return [
                        'Tally', 'Staff', 'Purifier', 'WholeHouse'
                    ].includes(key);
                },
                message: 'Invalid key value'
            }
        },
        origins_list: [],                               // For Staff


    },
    {
        timestamps: true
    })

const AdminModel = mongoose.model('admin', adminSchema, 'admin')
module.exports = AdminModel