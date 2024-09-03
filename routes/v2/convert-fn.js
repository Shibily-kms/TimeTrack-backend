const express = require('express')
const mongoose = require('mongoose');
const router = express.Router();
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../../models/staff-model');
const StaffAccount = require('../../models/staff-account')

router.get('/staff-accounts', async (req, res) => {
    try {
        // Convert all staff accounts
        const allStaff = await StaffModel.find()
        const staffList = []

        allStaff.map(async (staff) => {

            const obj = {
                acc_id: new ObjectId(staff._doc._id),
                primary_number: {
                    country_code: '91',
                    number: staff._doc.contact1
                },
                email_address: {
                    mail: staff._doc.email_id
                },
                text_password: staff._doc.password,
                dropped_account: staff._doc.delete || undefined,
            }

            staffList.push(obj)

            await StaffModel.updateOne({ _id: new ObjectId(staff._doc._id) }, {
                $set: {
                    secondary_number: staff._doc.contact2
                        ? {
                            country_code: '91',
                            number: staff._doc.contact2
                        }
                        : undefined,
                    whatsapp_number: staff._doc.whatsapp
                        ? {
                            country_code: '91',
                            number: staff._doc.whatsapp
                        }
                        : undefined
                }
            })

        })
        await StaffAccount.create(staffList)

        await StaffModel.updateMany({}, {
            $unset: {
                contact2: 1,
                whatsapp: 1,
                origins_list: 1,
                password: 1,
                user_name: 1,
                contact1: 1,
                email_id: 1
            }
        })

        res.status(201).json('Completed with ' + allStaff.length + ' documents')

    } catch (error) {
        throw error
    }
})


module.exports = router