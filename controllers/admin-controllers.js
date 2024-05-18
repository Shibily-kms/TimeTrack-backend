const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const jwt = require('jsonwebtoken')
const { successResponse, errorResponse } = require('../helpers/response-helper')
const AdminModel = require('../models/admin-models')
const StaffModel = require('../models/staff-model')
const DesignationModel = require('../models/designation_models')

const postLogin = (req, res, next) => {
    try {
        const { user_name, password } = req.body

        if (!user_name || !password) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const adminDetails = {
            EMAIL: process.env.ADMIN_EMAIL,
            USER_NAME: process.env.ADMIN_USER_NAME,
            PASSWORD: process.env.ADMIN_PASSWORD,
            PRO_ADMIN: true,
            PRO_KEY: process.env.ADMIN_PRO_KEY,
        }

        if (adminDetails.USER_NAME !== user_name) {
            return res.status(404).json(errorResponse('Invalid user name', 404))
        }

        if (adminDetails.PASSWORD !== password) {
            return res.status(404).json(errorResponse('Incorrect password', 404))
        }

        const maxAge = 60 * 60 * 24 * 30;
        const token = jwt.sign({ user_name: adminDetails.USER_NAME, admin_key: adminDetails.PRO_KEY, }, process.env.TOKEN_KEY, { expiresIn: maxAge })

        res.status(201).json(successResponse('Admin login success', {
            email_id: adminDetails.EMAIL,
            user_name: adminDetails.USER_NAME,
            token,
            pro_admin: adminDetails.PRO_ADMIN,
            admin_key: adminDetails.PRO_KEY,
        }))

    } catch (error) {
        next(error)
    }
}

const getAllOrigins = async (req, res, next) => {
    try {
        const admin = await AdminModel.findOne({ access_key: 'Staff' })

        res.status(201).json(successResponse('Origin list', admin?.origins_list || []))
    } catch (error) {
        next(error)
    }
}

const postOriginLogin = async (req, res, next) => {
    try {
        const { staff_id } = req.query

        if (!staff_id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const user = await StaffModel.findOne({ _id: new ObjectId(staff_id), delete: { $ne: true } })

        if (!user) {
            return res.status(404).json(errorResponse('Invalid Staff ID', 404))
        }

        if (!user.origins_list.includes('Staff_Admin')) {
            return res.status(404).json(errorResponse('Origin access are blocked', 404))
        }

        const designation_details = await DesignationModel.findById({ _id: user.designation }, { delete: 0, name: 0, updatedAt: 0, __v: 0, createdAt: 0 })

        const maxAge = 60 * 60 * 24 * 30
        const token = jwt.sign({ user_name: user._id, admin_key: process.env.ADMIN_KEY, }, process.env.TOKEN_KEY, { expiresIn: maxAge })

        const adminData = {
            temp_id: user._doc._id,
            email_id: user._doc.email_id,
            user_name: user._doc.first_name + ' ' + user._doc.last_name,
            designation: designation_details.designation,
            token,
            pro_admin: false,
            admin_key: process.env.ADMIN_KEY,
        }

        res.status(201).json(successResponse('Admin login success', adminData))
    } catch (error) {
        next(error)
    }
}

module.exports = {
    postLogin, getAllOrigins, postOriginLogin
}