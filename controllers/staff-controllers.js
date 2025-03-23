const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const StaffAccountModel = require('../models/staff-account')
const StaffWorksModel = require('../models/staff_works_model')
const DesignationModel = require('../models/designation_models')
const bcrypt = require('bcrypt');
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { schedulerFunction } = require('../controllers/auto-fun-controller');
const { findStaffByPrimaryNumber } = require('../services/staffServices');
const { YYYYMMDDFormat } = require('../helpers/dateUtils');



const checkUserActive = async (req, res, next) => {
    try {

        const user = await StaffModel.findOne({ _id: new ObjectId(req.user.acc_id), delete: { $ne: true } })
        if (!user) {
            return res.status(404).json(errorResponse('This account as been deleted', 404))
        }

        const designation_details = await DesignationModel.findById({ _id: user.designation }, { delete: 0, name: 0, updatedAt: 0, __v: 0, createdAt: 0 })

        const activeData = {
            sid: user?.sid,
            first_name: user._doc.first_name,
            last_name: user._doc.last_name,
            designation: designation_details,
            dob: user._doc.dob,
            profile_image: user._doc?.profile_image || null,
            status: user._doc.delete ? 'Left' : 'Active',
            punch_type: user._doc.punch_type,
            auto_punch_out: user._doc.auto_punch_out,
            origins_list: user._doc.origins_list,
        }

        res.status(201).json(successResponse('This is active user', activeData))
    } catch (error) {
        next(error)
    }
}

const getSingeStaffInfo = async (req, res, next) => {
    try {

        const acc_id = req.params.accId
        const { initial, profession } = req.query
        const userData = await StaffModel.findOne({ _id: new ObjectId(acc_id) }).populate('designation', 'designation')
        const accountData = await StaffAccountModel.findOne({ acc_id: new ObjectId(acc_id) })

        const responseData = {}

        // from user Data
        responseData._id = userData._doc._id
        responseData.sid = userData._doc.sid
        responseData.first_name = userData._doc.first_name
        responseData.last_name = userData._doc.last_name
        responseData.gender = userData._doc.gender
        responseData.dob = userData._doc.dob
        responseData.delete = userData._doc.delete || false
        responseData.designation = userData._doc.designation.designation || null
        responseData.designation_id = userData._doc.designation._id
        responseData.secondary_number = userData._doc.secondary_number
        responseData.whatsapp_number = userData._doc.whatsapp_number

        // from account data
        responseData.primary_number = accountData._doc.primary_number

        if (profession) {
            responseData.current_salary = userData._doc.current_salary
            responseData.current_working_days = userData._doc.current_working_days
            responseData.current_working_time = userData._doc.current_working_time
            responseData.balance_CF = userData._doc.balance_CF
            responseData.punch_type = userData._doc.punch_type
            responseData.auto_punch_out = userData._doc.auto_punch_out
            responseData.official_number = userData._doc.official_number
            responseData.join_date = userData._doc.join_date
            responseData.work_mode = userData._doc.work_mode
            responseData.e_type = userData._doc.e_type
            responseData.resign_date = userData._doc.resign_date
            responseData.deleteReason = userData._doc.deleteReason
        }

        if (!initial) {
            responseData.address = userData._doc.address
            responseData.whatsapp_number = userData._doc.whatsapp_number
            responseData.last_tp_changed = accountData._doc.last_tp_changed
            responseData.email_address = accountData._doc.email_address
        }

        res.status(201).json(successResponse('Profile details', responseData))

    } catch (error) {
        next(error)
    }
}

const updateProfile = async (req, res, next) => {
    const { staff_id, ...data } = req.body

    if (!staff_id || !data.address || !data.place || !data.post || !data.district || !data.pin_code || !data.email_id) {
        return res.status(409).json(errorResponse('Request body is missing', 409))
    }

    const updateData = await StaffModel.updateOne({ _id: new ObjectId(staff_id) }, {
        $set: {
            'address.address': data.address,
            'address.place': data.place,
            'address.post': data.post,
            'address.pin_code': data.pin_code,
            'address.district': data.district,
            'address.state': data.state,
            'email_id': data.email_id,
            'gender': data.gender,
            'contact2': data.contact2,
            'whatsapp': data.whatsapp,
        }
    })

    if (!updateData?.modifiedCount) {
        return res.status(404).json(errorResponse('Invalid staff Id', 404))
    }

    res.status(201).json(successResponse('Updated'))

}

const getAllStaffs = async (req, res, next) => {
    try {
        const { all, nameOnly } = req.query

        let matchStages = {}
        let projectStage = {}

        // If not 'all'
        if (!all) {
            matchStages = { delete: { $ne: true } }
        }

        // if not 'name only'
        if (!nameOnly) {
            projectStage = {
                sid: 1,
                primary_number: { $arrayElemAt: ['$accData.primary_number', 0] },
                balance_CF: 1,
                current_salary: 1,
                current_working_days: 1,
                current_working_time: 1,
                work_mode: 1,
                e_type: 1
            }
        }

        const staffList = await StaffModel.aggregate([
            {
                $match: matchStages
            },
            {
                $lookup: {
                    from: 'existing_designations',
                    localField: 'designation',
                    foreignField: '_id',
                    as: 'desiData'
                }
            },
            {
                $lookup: {
                    from: 'staff_accounts',
                    localField: '_id',
                    foreignField: 'acc_id',
                    as: 'accData'
                }
            },
            {
                $project: {
                    first_name: 1, last_name: 1,
                    full_name: { $concat: ["$first_name", " ", "$last_name"] },
                    'designation._id': { $arrayElemAt: ['$desiData._id', 0] },
                    'designation.designation': { $arrayElemAt: ['$desiData.designation', 0] },
                    delete: 1,
                    deleteReason: 1,
                    createdAt: 1,
                    ...projectStage
                }
            },
            {
                $sort: {
                    full_name: 1
                }
            }

        ])

        res.status(201).json(successResponse('Staff account list', staffList))

    } catch (error) {
        next(error)
    }
}

const newPassword = async (req, res, next) => {
    try {
        const { country_code, mobile_number, newPass } = req.body

        if (!country_code || !mobile_number || !newPass) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const hashedPassword = await bcrypt.hash(newPass, 10);
        await StaffAccountModel.updateOne({
            'primary_number.country_code': country_code,
            'primary_number.number': mobile_number,
            dropped_account: { $ne: true }
        }, {
            $set: {
                text_password: hashedPassword,
                last_tp_changed: new Date()
            }
        })

        res.status(201).json(successResponse('Password change success'))

    } catch (error) {
        next(error)
    }
}

//*v2
const getInitialAccountInfo = async (req, res, next) => {
    try {
        const acc_id = req.query.accId || req.user.acc_id
        const dvc_id = req.user.dvc_id || null

        if (!acc_id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const accountInfo = await StaffAccountModel.findOne({ acc_id: new ObjectId(acc_id) })
        const userInfo = await StaffModel.findOne({ _id: new ObjectId(acc_id) }).populate('designation', 'designation')

        const responseObj = {
            acc_id: acc_id,
            dvc_id: dvc_id || null,
            first_name: userInfo._doc.first_name,
            last_name: userInfo._doc.last_name,
            dob: userInfo._doc.dob,
            designation: userInfo._doc.designation.designation,
            designation_id: userInfo._doc.designation._id,
            punch_type: userInfo._doc.punch_type,
            auto_punch_out: userInfo._doc.auto_punch_out || null,
            delete: userInfo._doc.delete || false,
            allowed_origins: accountInfo._doc.allowed_origins || []
        }

        res.status(201).json(successResponse('Account initial info', responseObj))

    } catch (error) {
        next(error)
    }
}

const updateWorkerAddress = async (req, res, next) => {
    try {

        const { gender, ...address } = req.body
        const acc_id = req.params.accId

        if (!gender || !address.place || !address.post || !address.state || !address.country) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const userData = await StaffModel.findOne({ _id: new ObjectId(acc_id), delete: { $ne: true } })

        if (!userData) {
            return res.status(404).json(errorResponse('Invalid account Id', 404))
        }

        await StaffModel.updateOne({ _id: new ObjectId(acc_id) }, {
            $set: {
                gender: gender,
                'address.address': address.address || null,
                'address.place': address.place || null,
                'address.post': address.post || null,
                'address.pin_code': address.pin_code || null,
                'address.district': address.district || null,
                'address.state': address.state || null,
                'address.country': address.country || null,
            }
        })

        res.status(201).json(successResponse('Address updated'))

    } catch (error) {
        next(error)
    }
}

const updateWorkerContact = async (req, res, next) => {
    try {

        const { type, contact } = req.body
        const acc_id = req.params.accId

        if (!type || !contact) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const userData = await StaffModel.findOne({ _id: new ObjectId(acc_id), delete: { $ne: true } })
        const accountData = await StaffAccountModel.findOne({ acc_id: new ObjectId(acc_id), dropped_account: { $ne: true } })

        if (!userData || !accountData) {
            return res.status(404).json(errorResponse('Invalid account Id', 404))
        }

        // Primary number and secondary number match validation
        if (type === 'primary_number' && userData._doc.secondary_number.country_code === contact.country_code
            && userData._doc.secondary_number.number === contact.number
        ) {
            return res.status(400).json(errorResponse('The Primary and Secondary numbers cannot be the same.', 400))
        }

        if (type === 'secondary_number' && accountData._doc.primary_number.country_code === contact.country_code
            && accountData._doc.primary_number.number === contact.number
        ) {
            return res.status(400).json(errorResponse('The Primary and Secondary numbers cannot be the same.', 400))
        }

        // Check the primary number is Unique
        if (type === 'primary_number') {
            const accountValidation = await StaffAccountModel.findOne({
                'primary_number.country_code': contact.country_code,
                'primary_number.number': contact.number,
                dropped_account: { $ne: true }
            })

            if (accountValidation && accountValidation._doc.acc_id != acc_id) {
                return res.status(400).json(errorResponse('This primary number is currently used by another contact.', 400))
            }
        }

        // Update

        if (type === 'primary_number' || type === 'email_address') {
            await StaffAccountModel.updateOne({ acc_id: new ObjectId(acc_id) }, {
                $set: {
                    [type]: contact
                }
            })
        } else {
            await StaffModel.updateOne({ _id: new ObjectId(acc_id) }, {
                $set: {
                    [type]: contact
                }
            })
        }

        res.status(201).json(successResponse('Contact updated'))

    } catch (error) {
        next(error)
    }
}

const removeWorkerContact = async (req, res, next) => {
    try {
        const { type } = req.query
        const acc_id = req.params.accId

        if (!type) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const userData = await StaffModel.findOne({ _id: new ObjectId(acc_id), delete: { $ne: true } })
        const accountData = await StaffAccountModel.findOne({ acc_id: new ObjectId(acc_id), dropped_account: { $ne: true } })

        if (!userData || !accountData) {
            return res.status(404).json(errorResponse('Invalid account Id', 404))
        }

        if (!['secondary_number', 'official_number'].includes(type)) {
            return res.status(404).json(errorResponse('Can not remove this type number', 404))
        }

        await StaffModel.updateOne({ _id: new ObjectId(acc_id) }, {
            $set: {
                [type]: {}
            }
        })

        res.status(201).json(successResponse('Contact Removed'))
    } catch (error) {
        next(error)
    }
}

const createAccount = async (req, res, next) => {
    try {
        const { first_name, last_name, primary_number, dob, designation } = req.body

        if (!first_name || !last_name || !primary_number?.number || !dob || !designation) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        let existingUser = await findStaffByPrimaryNumber(primary_number?.country_code, primary_number?.number)
        if (existingUser) {
            return res.status(409).json(errorResponse('This Primary number already exists', 409))
        }

        // work time convert
        const timeSplit = req.body.current_working_time.split(':')
        current_working_time = (timeSplit[0] * 3600) + (timeSplit[1] * 60)

        // Create staff data

        const staffObj = {
            sid: req.body.sid || '',
            first_name: req.body.first_name || '',
            last_name: req.body.last_name || '',
            gender: req.body.gender || '',
            address: {
                address: req.body.first_name || '',
                place: req.body.place || '',
                post: req.body.post || '',
                pin_code: req.body.pin_code || '',
                district: req.body.district || '',
                state: req.body.state || '',
                country: req.body.country || 'India',
            },
            designation: req.body.designation ? new ObjectId(req.body.designation) : undefined,
            dob: req.body.dob || '',
            current_salary: req.body.current_salary || 0,
            current_working_days: req.body.current_working_days || 0,
            current_working_time: current_working_time || 0,
            balance_CF: 0,
            punch_type: 'scanner',

            secondary_number: req.body.secondary_number?.number ?
                {
                    country_code: req.body.secondary_number?.country_code || '',
                    number: req.body.secondary_number?.number || ''
                } : undefined,
            official_number: req.body.official_number?.number ?
                {
                    country_code: req.body.official_number?.country_code || '',
                    number: req.body.official_number?.number || ''
                } : undefined,
            whatsapp_number: req.body.whatsapp_number?.number ?
                {
                    country_code: req.body.whatsapp_number?.country_code || '',
                    number: req.body.whatsapp_number?.number || ''
                } : undefined,
            join_date: req.body.join_date || '',
            work_mode: req.body.work_mode || '',
            e_type: req.body.e_type || ''
        }
        const staffData = await StaffModel.create(staffObj)

        if (staffData) {
            //update Designation
            const addDesignation = await DesignationModel.findOneAndUpdate(
                { _id: designation },
                { $push: { name: staffData._id } },
                { new: true }
            );

            if (!addDesignation) {
                await StaffModel.deleteOne({ _id: new ObjectId(staffData._id) })
                return res.status(409).json(errorResponse('Invalid designation Id'))
            }


            // Set Password
            const text_password = dob.replace(/-/g, "")
            const hashedPassword = await bcrypt.hash(text_password, 10);

            // create Account
            const accountObj = {
                acc_id: new ObjectId(staffData._id),
                primary_number: {
                    country_code: req.body.primary_number?.country_code || '',
                    number: req.body.primary_number?.number || ''
                },
                email_address: {
                    mail: req.body.email_id
                },
                allowed_origins: [],
                text_password: hashedPassword
            }
            await StaffAccountModel.create(accountObj)

            res.status(201).json(successResponse('Account created', { acc_id: staffData._id }))

        } else {
            throw Error('Unknown error')
        }

    } catch (error) {
        next(error)
    }
}

const adminUpdateWorkerInfo = async (req, res, next) => {
    try {
        let { _id, first_name, last_name, gender, dob, designation_id, sid,
            current_salary, current_working_days, current_working_time } = req.body

        if (!_id || !first_name || !last_name || !gender || !designation_id || !dob || !current_working_time || !sid) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const timeSplit = current_working_time.split(':')
        current_working_time = (timeSplit[0] * 3600) + (timeSplit[1] * 60)

        const staff = await StaffModel.findOne({ _id: new ObjectId(_id), delete: { $ne: true } })

        // Update in StaffData DB
        await StaffModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                sid: sid,
                first_name,
                last_name,
                gender: gender,
                designation: new ObjectId(designation_id),
                dob,
                'address.address': req.body.address,
                'address.place': req.body.place,
                'address.post': req.body.post,
                'address.pin_code': req.body.pin_code,
                'address.district': req.body.district,
                'address.state': req.body.state,
                current_salary,
                current_working_days,
                current_working_time,
                join_date: req.body.join_date,
                work_mode: req.body.work_mode,
                e_type: req.body.e_type
            }
        })

        if (staff && staff.designation != designation_id) {
            // Pull
            await DesignationModel.updateOne({ _id: new ObjectId(staff.designation) }, {
                $pull: {
                    name: new ObjectId(_id)
                }
            })
            // Push
            await DesignationModel.updateOne({ _id: new ObjectId(designation_id) }, {
                $push: {
                    name: new ObjectId(_id)
                }
            })
        }

        res.status(201).json(successResponse('Profile updated'))

    } catch (error) {
        next(error)
    }
}

const deleteStaffAccount = async (req, res, next) => {
    try {
        const { resign_date, reason } = req.query
        const acc_id = req.params.accId

        if (!resign_date || !reason) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        // Find delete type
        const works = await StaffWorksModel.findOne({ name: new ObjectId(acc_id) })

        // if works : soft delete
        if (works) {

            let obj = {
                status: 'Resigned',
                date: new Date(),
                reason
            }

            const doDelete = await StaffModel.updateOne({ _id: new ObjectId(acc_id), delete: { $ne: true } },
                {
                    $set: {
                        delete: true,
                        deleteReason: obj,
                        resign_date
                    }
                })

            await StaffAccountModel.updateOne({ acc_id: new ObjectId(acc_id) }, {
                $set: {
                    dropped_account: true
                }
            })

            await DesignationModel.updateOne({ name: { $in: [new ObjectId(acc_id)] } }, {
                $pull: { name: new ObjectId(acc_id) }
            })

            if (doDelete.modifiedCount <= 0) {
                return res.status(404).json(errorResponse('Invalid account Id', 404))
            }

            res.status(201).json(successResponse('Account soft deleted'))
        }

        // if not works : hard delete
        if (!works) {

            const doDelete = await StaffModel.deleteOne({ _id: new ObjectId(acc_id), delete: { $ne: true } })
            await StaffAccountModel.deleteOne({ acc_id: new ObjectId(acc_id) })
            await DesignationModel.updateOne({ name: { $in: [new ObjectId(acc_id)] } }, {
                $pull: { name: new ObjectId(acc_id) }
            })

            if (doDelete.deletedCount <= 0) {
                return res.status(404).json(errorResponse('Invalid account id', 404))
            }

            res.status(201).json(successResponse('Account hard deleted'))
        }

    } catch (error) {
        next(error)
    }
}

const updateSettings = async (req, res, next) => {
    try {
        const { punch_type, auto_punch_out, allowed_origins } = req.body
        const acc_id = req.params.accId

        if (!punch_type) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        // Update in Data
        const updateData = await StaffModel.updateOne({ _id: new ObjectId(acc_id), delete: { $ne: true } }, {
            $set: {
                punch_type,
                auto_punch_out: punch_type !== 'scanner' ? auto_punch_out : null,
                origins_list: allowed_origins
            }
        })

        // Update in account data
        await StaffAccountModel.updateOne({ acc_id: new ObjectId(acc_id) }, {
            $set: {
                allowed_origins: allowed_origins
            }
        })

        if (!updateData.modifiedCount) {
            return res.status(400).json(errorResponse('Invalid account Id', 400))
        }

        res.status(201).json(successResponse('Settings updated'))

        // Recall Scheduler Function for reschedule
        schedulerFunction()


    } catch (error) {
        next(error)
    }
}

const updateWorkerCommonData = async (req, res, next) => {
    try {
        let { current_working_days, current_working_time } = req.body

        if (!current_working_days) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        let setObj = {
            current_working_days: Number(current_working_days)
        }

        if (current_working_time) {
            const timeSplit = current_working_time.split(':')
            current_working_time = (timeSplit[0] * 3600) + (timeSplit[1] * 60)

            setObj['current_working_time'] = current_working_time
        }

        await StaffModel.updateMany({
            $or: [
                { delete: { $ne: true } },
                { delete: { $exists: false } }
            ]
        }, {
            $set: setObj
        })

        res.status(201).json(successResponse("Updated", {}, 201))

    } catch (error) {
        next(error)
    }
}

const getStaffStatusByOrigin = async (req, res, next) => {
    try {
        let { origins, last_action, limit } = req.query

        if (!origins) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        origins = origins?.split(' ')
        const today = YYYYMMDDFormat(new Date())

        const data = await StaffAccountModel.aggregate([
            {
                $match: {
                    allowed_origins: { $in: origins }
                }
            },
            {
                $lookup: {
                    from: 'staff_works_details',
                    let: { dateField: today, accIdField: '$acc_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$name", "$$accIdField"] }, // First condition
                                        { $eq: ["$date", "$$dateField"] }  // Second condition
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'workData'
                }
            },
            {
                $lookup: {
                    from: 'leave_application_list',
                    let: { dateField: today, accIdField: '$acc_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$staff_id", "$$accIdField"] }, // First condition
                                        { $eq: [{ $arrayElemAt: [{ $arrayElemAt: ["$approved_days", 0] }, 0] }, "$$dateField"] }  // Second condition
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'leaveData'
                }
            },
            {
                $lookup: {
                    from: "staff_datas",
                    localField: 'acc_id',
                    foreignField: '_id',
                    as: 'staffData'
                }
            },
            {
                $lookup: {
                    from: "existing_designations",
                    localField: 'staffData.designation',
                    foreignField: '_id',
                    as: 'designationData'
                }
            },
            {
                $project: {
                    acc_id: 1,
                    first_name: { $arrayElemAt: ['$staffData.first_name', 0] },
                    last_name: { $arrayElemAt: ['$staffData.last_name', 0] },
                    designation: { $arrayElemAt: ['$designationData.designation', 0] },
                    punch_list: { $arrayElemAt: ['$workData.punch_list', 0] },
                    leave_id: { $arrayElemAt: ['$leaveData.token_id', 0] },
                    punch_last_action: { $arrayElemAt: ['$workData.updatedAt', 0] }
                }
            },
            {
                $project: {
                    acc_id: 1,
                    first_name: 1,
                    last_name: 1,
                    designation: 1,
                    punch_last_action: 1,
                    status: {
                        $cond: {
                            if: { $isArray: "$punch_list" }, // Check punch_list first
                            then: {
                                $cond: {
                                    if: { $eq: [{ $arrayElemAt: ["$punch_list.out", -1] }, null] },
                                    then: "IN", // If last out is null, status is IN (even if leave_id exists)
                                    else: "OUT" // If last out exists, status is OUT
                                }
                            },
                            else: {
                                $cond: {
                                    if: { $ifNull: ["$leave_id", false] }, // If no punch_list, check leave_id
                                    then: "LEAVE",
                                    else: "PENDING"
                                }
                            }
                        }
                    },
                }
            },
            {
                $sort: (last_action === 'Yes'
                    ? { punch_last_action: -1 }
                    : { first_name: 1, last_name: 1 })
            },
            ...(limit && Number(limit) ? [{ $limit: Number(limit) }] : []),

        ])

        res.status(201).json(successResponse("Updated", data, 201))
       
    } catch (error) {
        next(error)
    }
}



module.exports = {
    createAccount, getAllStaffs, deleteStaffAccount, getSingeStaffInfo, checkUserActive,
    updateProfile, updateSettings, newPassword, getInitialAccountInfo, updateWorkerAddress, updateWorkerContact,
    adminUpdateWorkerInfo, updateWorkerCommonData, removeWorkerContact, getStaffStatusByOrigin

}