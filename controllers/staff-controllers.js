const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
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

        const designation_details = await DesignationModel.findById({ _id: user.designation })
        const maxAge = 60 * 60 * 24 * 30
        const token = jwt.sign({ user: user._id }, process.env.TOKEN_KEY, { expiresIn: maxAge })

        delete user._doc.password
        delete user._doc.delete
        delete user._doc.updatedAt
        delete user._doc.__v
        user._doc.token = token
        user._doc.designation = {
            id: designation_details._id,
            designation: designation_details.designation,
            allow_sales: designation_details.allow_sales || false,
            auto_punch_out: designation_details.auto_punch_out || '17:30'
        }

        res.status(201).json(successResponse('User login success', user))

    } catch (error) {
        next(error)
    }
}

const getOneStaff = async (req, res, next) => {
    try {
        const staffId = req.params.staffId || req.query.staffId

        if (!staffId) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const staff = await StaffModel.findOne({ _id: new ObjectId(staffId), delete: { $ne: true } }, { password: 0, delete: 0, updatedAt: 0, __v: 0 }).
            populate('designation', 'designation')

        res.status(201).json(successResponse('Staff profile details', staff))

    } catch (error) {
        next(error)
    }
}

const getAllStaffs = async (req, res, next) => {
    try {
        const staffs = await StaffModel.find({ delete: { $ne: true } }, { user_name: 1, contact: 1, designation: 1, first_name: 1, last_name: 1 }).
            populate('designation', 'designation')
        res.status(201).json(successResponse('All staffs list', staffs))

    } catch (error) {
        next(error)
    }
}

const deleteStaff = async (req, res, next) => {
    try {
        const { id } = req.query

        if (!id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const doDelete = await StaffModel.updateOne({ _id: new ObjectId(id), delete: { $ne: true } },
            { $set: { delete: true } })

        if (doDelete.modifiedCount <= 0) {
            return res.status(404).json(errorResponse('Invalid staff id', 404))
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
        const { _id, first_name, last_name, email_id, contact, designation, dob, place, pin_code } = req.body
        if (!_id || !first_name || !last_name || !email_id || !contact || !designation || !dob || !place || !pin_code) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const existingUser = await StaffModel.findOne({ contact })
        if (existingUser && existingUser?._id != _id) {
            return res.status(409).json(errorResponse('This mobile number already exists', 409))
        }

        await StaffModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                first_name,
                last_name,
                email_id,
                contact,
                dob,
                designation: new ObjectId(designation),
                'address.place': place,
                'address.pin_code': pin_code
            }
        })

        res.status(201).json(successResponse('Staff data updating success'))

    } catch (error) {
        next(error)
    }
}

module.exports = {
    createAccount, doLogin, getAllStaffs, deleteStaff, changePassword, getOneStaff, adminEditStaff
}