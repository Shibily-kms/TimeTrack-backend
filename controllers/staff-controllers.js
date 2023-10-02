const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const StaffWorksModel = require('../models/staff_works_model')
const DesignationModel = require('../models/designation_models')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { generatePassword } = require('../helpers/password-helper')


const createAccount = async (req, res, next) => {
    try {
        const { first_name, last_name, email_id, contact, designation, dob, place, pin_code } = req.body

        if (!first_name || !last_name || !email_id || !contact || !designation || !dob || !place || !pin_code) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        let existingUser = await StaffModel.findOne({ contact })
        if (existingUser) {
            return res.status(409).json(errorResponse('This mobile number already exists', 409))
        }
        const password = generatePassword()
        const hashedPassword = await bcrypt.hash(password, 10);
        req.body.address = { place, pin_code }
        req.body.password = hashedPassword;
        req.body.current_salary = 0
        req.body.current_working_days = 0
        req.body.current_working_time = 0
        req.body.balance_CF = 0
        req.body.delete = false

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

        newUser._doc.password = password
        newUser._doc.designation = { designation: addDesignation.designation }
        delete newUser._doc.delete
        delete newUser._doc.regular_works
        delete newUser._doc.updatedAt
        delete newUser._doc.__v

        res.status(201).json(successResponse('Creation success', newUser))

    } catch (error) {
        next(error)
    }
}

const doLogin = async (req, res, next) => {
    try {
        const { user_name, password } = req.body;

        if (!user_name || !password) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const user = await StaffModel.findOne({ $or: [{ user_name }, { contact: user_name }], delete: { $ne: true } })
        if (!user) {
            return res.status(401).json(errorResponse('Invalid user name or mobile ', 401))
        }

        const password_check = await bcrypt.compare(password, user.password);
        if (!password_check) {
            return res.status(401).json(errorResponse('Incorrect password', 401))
        }

        const designation_details = await DesignationModel.findById({ _id: user.designation }, { delete: 0, name: 0, updatedAt: 0, __v: 0, createdAt: 0 })
        const maxAge = 60 * 60 * 24 * 30
        const token = jwt.sign({ user: user._id }, process.env.TOKEN_KEY, { expiresIn: maxAge })

        delete user._doc.password
        delete user._doc.regular_works
        delete user._doc.delete
        delete user._doc.updatedAt
        delete user._doc.__v
        user._doc.token = token
        user._doc.designation = designation_details

        res.status(201).json(successResponse('User login success', user))

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

        let staff = []
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

const getAllStaffs = async (req, res, next) => {
    try {
        const { all } = req.query
        let staffs = []
        if (all === 'yes') {
            staffs = await StaffModel.find({}, {
                user_name: 1, contact: 1, designation: 1, first_name: 1, last_name: 1, deleteReason: 1, balance_CF: 1,
                current_salary: 1, current_working_days: 1, current_working_time: 1, delete: 1, createdAt: 1
            }).
                populate('designation', 'designation').sort({ first_name: 1, last_name: 1 })
        } else {
            staffs = await StaffModel.find({ delete: { $ne: true } }, {
                user_name: 1, contact: 1, designation: 1, first_name: 1, last_name: 1, balance_CF: 1,
                current_salary: 1, current_working_days: 1, current_working_time: 1
            }).
                populate('designation', 'designation').sort({ first_name: 1, last_name: 1 })
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
        const userId = req.user.id

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

const adminEditStaff = async (req, res, next) => {
    try {
        let { _id, first_name, last_name, email_id, contact, designation, dob, place,
            pin_code, current_salary, current_working_days, current_working_time } = req.body
        if (!_id || !first_name || !last_name || !email_id || !contact || !designation || !dob ||
            !place || !pin_code || !current_working_time) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const existingUser = await StaffModel.findOne({ contact })
        if (existingUser && existingUser?._id != _id) {
            return res.status(409).json(errorResponse('This mobile number already exists', 409))
        }

        const staff = await StaffModel.findOne({ _id: new ObjectId(_id), delete: { $ne: true } })
        if (!staff) {
            return res.status(400).json(errorResponse('Invalid Id or account already deleted', 400))
        }
        const timeSplit = current_working_time.split(':')
        current_working_time = (timeSplit[0] * 3600) + (timeSplit[1] * 60)

        await StaffModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                first_name,
                last_name,
                email_id,
                contact,
                dob,
                current_salary,
                current_working_days,
                current_working_time,
                designation: new ObjectId(designation),
                'address.place': place,
                'address.pin_code': pin_code
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

module.exports = {
    createAccount, doLogin, getAllStaffs, deleteStaff, changePassword, getOneStaff, adminEditStaff
}