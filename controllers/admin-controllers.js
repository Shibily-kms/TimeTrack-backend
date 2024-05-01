const jwt = require('jsonwebtoken')
const { successResponse, errorResponse } = require('../helpers/response-helper')
const AdminModel = require('../models/admin-models')

const postLogin = (req, res, next) => {
    try {
        const { user_name, password } = req.body

        if (!user_name || !password) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const adminDetails = {
            EMAIL: process.env.ADMIN_EMAIL,
            USER_NAME: process.env.ADMIN_USER_NAME,
            PASSWORD: process.env.ADMIN_PASSWORD
        }

        if (adminDetails.USER_NAME !== user_name) {
            return res.status(404).json(errorResponse('Invalid user name', 404))
        }

        if (adminDetails.PASSWORD !== password) {
            return res.status(404).json(errorResponse('Incorrect password', 404))
        }

        const maxAge = 60 * 60 * 24 * 30;
        const token = jwt.sign({ user_name: adminDetails.USER_NAME }, process.env.TOKEN_KEY, { expiresIn: maxAge })

        res.status(201).json(successResponse('Admin login success', { email_id: adminDetails.EMAIL, user_name: adminDetails.USER_NAME, token }))

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

module.exports = {
    postLogin, getAllOrigins
}