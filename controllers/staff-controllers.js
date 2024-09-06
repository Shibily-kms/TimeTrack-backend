const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const StaffAccountModel = require('../models/staff-account')
const StaffWorksModel = require('../models/staff_works_model')
const DesignationModel = require('../models/designation_models')
const bcrypt = require('bcrypt');
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { schedulerFunction } = require('../controllers/auto-fun-controller');


const createAccount = async (req, res, next) => {
    try {
        const { first_name, last_name, email_id, contact1, designation, dob } = req.body

        if (!first_name || !last_name || !email_id || !contact1 || !designation || !dob) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        let existingUser = await StaffModel.findOne({ contact1 })
        if (existingUser) {
            return res.status(409).json(errorResponse('This mobile number already exists', 409))
        }

        const hashedPassword = await bcrypt.hash(dob, 10);
        req.body.password = hashedPassword;
        req.body.current_salary = 0
        req.body.current_working_days = 0
        req.body.current_working_time = 0
        req.body.balance_CF = 0
        req.body.delete = false
        req.body.punch_type = 'scanner'


        const newUser = await StaffModel.create(req.body);
        const addDesignation = await DesignationModel.findOneAndUpdate(
            { _id: designation },
            { $push: { name: newUser._id } },
            { new: true }
        );

        if (!addDesignation) {
            await StaffModel.deleteOne({ _id: new ObjectId(newUser._id) })
            return res.status(409).json(errorResponse('Invalid designation Id'))
        }

        res.status(201).json(successResponse('Creation success'))

    } catch (error) {
        next(error)
    }
}

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

const getOneStaff = async (req, res, next) => {
    try {
        const staffId = req.params.staffId || req.query.staffId
        const { if_delete } = req.query

        if (!staffId) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        let staff = null
        if (if_delete === 'yes') {
            staff = await StaffModel.findOne({ _id: new ObjectId(staffId) }, { password: 0, regular_works: 0, updatedAt: 0, __v: 0 }).
                populate({
                    path: 'designation',
                    select: 'designation allow_origins auto_punch_out'
                })
        } else {
            staff = await StaffModel.findOne({ _id: new ObjectId(staffId), delete: { $ne: true } }, { password: 0, regular_works: 0, delete: 0, updatedAt: 0, __v: 0 }).
                populate({
                    path: 'designation',
                    select: 'designation allow_origins auto_punch_out'
                })
        }

        res.status(201).json(successResponse('Staff profile details', staff))

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

        // Get Object Key for filter
        let filter = {}
        if (nameOnly === 'yes') {
            filter = {
                first_name: 1, last_name: 1, 'designation._id': { $arrayElemAt: ['$desi._id', 0] },
                'designation.designation': { $arrayElemAt: ['$desi.designation', 0] },
                full_name: { $concat: ["$first_name", " ", "$last_name"] },

            }
        } else {
            filter = {
                sid: 1, contact1: 1, first_name: 1, last_name: 1, balance_CF: 1,
                current_salary: 1, current_working_days: 1, current_working_time: 1,
                'designation._id': { $arrayElemAt: ['$desi._id', 0] },
                'designation.designation': { $arrayElemAt: ['$desi.designation', 0] },
                full_name: { $concat: ["$first_name", " ", "$last_name"] },
            }
        }

        // Get Staffs
        let staffs = []
        if (all === 'yes') {
            staffs = await StaffModel.aggregate([
                {
                    $lookup: {
                        from: 'existing_designations',
                        localField: 'designation',
                        foreignField: '_id',
                        as: 'desi'
                    }
                },
                {
                    $project: {
                        ...filter,
                        deleteReason: 1, delete: 1, createdAt: 1
                    }
                },
                {
                    $sort: {
                        full_name: 1
                    }
                }

            ])
        } else {
            staffs = await StaffModel.aggregate([
                {
                    $match: { delete: { $ne: true } }
                },
                {
                    $lookup: {
                        from: 'existing_designations',
                        localField: 'designation',
                        foreignField: '_id',
                        as: 'desi'
                    }
                },
                {
                    $project: {
                        ...filter
                    }
                },
                {
                    $sort: {
                        full_name: 1
                    }
                }

            ])
        }

        res.status(201).json(successResponse('All staffs list', staffs))

    } catch (error) {
        next(error)
    }
}

const deleteStaff = async (req, res, next) => {
    try {
        const { id, type, message } = req.query

        if (!id || !type) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        if (type === 'hard') {
            const works = await StaffWorksModel.findOne({ name: new ObjectId(id) })
            if (works) {
                return res.status(400).json(errorResponse('This staff cannot be hard deleted'))
            }

            const doDelete = await StaffModel.deleteOne({ _id: new ObjectId(id), delete: { $ne: true } })

            if (doDelete.deletedCount <= 0) {
                return res.status(404).json(errorResponse('Invalid staff id', 404))
            }
        } else {
            let obj = {
                status: 'Resigned',
                date: new Date(),
                reason: message
            }
            const doDelete = await StaffModel.updateOne({ _id: new ObjectId(id), delete: { $ne: true } },
                {
                    $set: {
                        delete: true,
                        deleteReason: obj
                    }
                })

            if (doDelete.modifiedCount <= 0) {
                return res.status(404).json(errorResponse('Invalid staff id', 404))
            }
        }

        await DesignationModel.updateOne({ name: { $in: [new ObjectId(id)] } }, {
            $pull: { name: new ObjectId(id) }
        })

        res.status(201).json(successResponse('Deleted'))

    } catch (error) {
        next(error)
    }
}

const changePassword = async (req, res, next) => {
    try {
        const { current, newPass } = req.body
        const userId = req.user.acc_id

        if (!current || !newPass) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const staff = await StaffModel.findOne({ _id: new ObjectId(userId) })
        const password_check = await bcrypt.compare(current, staff.password);

        if (!password_check) {
            return res.status(400).json(errorResponse('Incorrect current password', 400))
        }

        const hashedPassword = await bcrypt.hash(newPass, 10);
        await StaffModel.updateOne({ _id: new ObjectId(userId) }, { $set: { password: hashedPassword } })

        res.status(201).json(successResponse('Password change success'))


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

const adminEditStaff = async (req, res, next) => {
    try {
        let { _id, first_name, last_name, email_id, designation, dob,
            current_salary, current_working_days, current_working_time } = req.body

        if (!_id || !first_name || !last_name || !email_id || !designation || !dob || !current_working_time) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const staff = await StaffModel.findOne({ _id: new ObjectId(_id), delete: { $ne: true } })
        if (!staff) {
            return res.status(400).json(errorResponse('Invalid Id or account already deleted', 400))
        }
        const timeSplit = current_working_time.split(':')
        current_working_time = (timeSplit[0] * 3600) + (timeSplit[1] * 60)

        await StaffModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                sid: req.body?.sid,
                first_name,
                last_name,
                gender: req.body?.gender,
                email_id,
                contact2: req.body.contact2,
                whatsapp: req.body.whatsapp,
                designation: new ObjectId(designation),
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
            }
        })

        if (staff.designation != designation) {
            // Pull
            await DesignationModel.updateOne({ _id: new ObjectId(staff.designation) }, {
                $pull: {
                    name: new ObjectId(_id)
                }
            })
            // Push
            await DesignationModel.updateOne({ _id: new ObjectId(designation) }, {
                $push: {
                    name: new ObjectId(_id)
                }
            })
        }

        res.status(201).json(successResponse('Staff data updating success'))

    } catch (error) {
        next(error)
    }
}

const updateSettings = async (req, res, next) => {
    try {
        const { staff_id, punch_type, auto_punch_out, origins_list } = req.body

        if (!staff_id || !punch_type) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const updateData = await StaffModel.updateOne({ _id: new ObjectId(staff_id), delete: { $ne: true } }, {
            $set: {
                punch_type,
                auto_punch_out: punch_type === 'software' ? auto_punch_out : null,
                origins_list: origins_list
            }
        })

        if (!updateData.modifiedCount) {
            return res.status(400).json(errorResponse('Invalid Staff Id', 400))
        }

        res.status(201).json(successResponse('Settings updated'))

        // Re call Scheduler Function for reschedule
        schedulerFunction()


    } catch (error) {
        next(error)
    }
}

//*v2
const getInitialAccountInfo = async (req, res, next) => {
    try {
        const acc_id = req.user.acc_id || req.query.acc_id
        const dvc_id = req.user.dvc_id || req.query.dvc_id

        if (!acc_id || !dvc_id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const accountInfo = await StaffAccountModel.findOne({ acc_id: new ObjectId(acc_id) })
        const userInfo = await StaffModel.findOne({ _id: new ObjectId(acc_id) })

        const responseObj = {
            acc_id: acc_id,
            dvc_id: dvc_id,
            first_name: userInfo._doc.first_name,
            last_name: userInfo._doc.last_name,
            dob: userInfo._doc.dob,
            designation_id: userInfo._doc.designation,
            punch_type: userInfo._doc.punch_type,
            auto_punch_out: userInfo._doc.auto_punch_out || null,
            delete: userInfo._doc.delete || false,
            allowed_origins: accountInfo._doc.allowed_origins.tt_user || []
        }

        res.status(201).json(successResponse('Account initial info', responseObj))

    } catch (error) {
        next(error)
    }
}

module.exports = {
    createAccount, getAllStaffs, deleteStaff, changePassword, getOneStaff, adminEditStaff, checkUserActive,
    updateProfile, updateSettings, newPassword, getInitialAccountInfo
}