const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const StaffAccountModel = require('../models/staff-account')
const DesignationModel = require('../models/designation_models')
const DeviceLogModel = require('../models/device-logs')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const geoip = require('geoip-lite');
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { generateAccessToken, generateRefreshToken } = require('../helpers/token-helper');
const { sendSmsWayText } = require('./sms-controller')


const doSignIn = async (req, res, next) => {
    try {
        const { country_code, mobile_number, password } = req.body;

        if (!country_code || !mobile_number || !password) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        // Validate Mobile number
        const isUser = await StaffAccountModel.findOne({
            'primary_number.country_code': country_code,
            'primary_number.number': mobile_number,
            dropped_account: { $ne: true }
        })

        if (!isUser) {
            return res.status(404).json(errorResponse('Invalid Mobile number', 404))
        }

        // Validate Password
        const passwordCheck = await bcrypt.compare(password, isUser._doc.text_password);

        if (!passwordCheck) {
            return res.status(404).json(errorResponse('Incorrect password', 404))
        }

        // 2A Verify 
        if (isUser._doc.two_step_auth && isUser._doc.two_step_auth.mobile_number
            && isUser._doc.two_step_auth.mobile_number.verified) {

            //  Send SMS
            await sendSmsWayText(
                isUser._doc.two_step_auth.mobile_number.country_code,
                isUser._doc.two_step_auth.mobile_number.number
            )

            // response
            const mobileNumber = isUser._doc.two_step_auth.mobile_number.number;
            const responseData = {
                authentication: true,
                redirect: true,
                redirect_type: '2A',
                twoA_type: 'mobile_number',
                country_code: isUser._doc.two_step_auth.mobile_number.country_code,
                mask_number: mobileNumber[0] + '*'.repeat(mobileNumber.length - 4) + mobileNumber.slice(-3),
                acc_id: isUser._doc.acc_id,
            }

            return res.status(201).json(successResponse('Redirect to 2A authentication', responseData))
        }

        const response = { authentication: true, acc_id: isUser._doc.acc_id }

        res.status(201).json(successResponse('Authentication Conditional OK', response))

    } catch (error) {
        next(error)
    }
}

const generateToken = async (req, res, next) => {
    try {

        const { acc_id, dvc_id, new_device } = req.body

        if (!acc_id || !dvc_id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        // Store Device Info
        if (new_device?.device_type) {
            const geo = geoip.lookup(new_device?.ip || null);

            const insertObj = {
                staff_id: new ObjectId(acc_id),
                dvc_id,
                acc_type: 'staff',
                os: new_device.os,
                browser: new_device.browser,
                device: new_device.device,
                geo: {
                    country: geo.country,
                    region: geo.region,
                    timezone: geo.timezone,
                    city: geo.city,
                    ll: geo.ll
                },
                device_type: new_device.device_type,
                last_login: new Date(),
                last_active: new Date()
            }

            await DeviceLogModel.create(insertObj)
        } else {
            await DeviceLogModel.updateOne({ dvc_id }, {
                $set: {
                    last_login: new Date(),
                    last_active: new Date()
                }
            })
        }

        // Collect Login response data
        const staffData = await StaffModel.findOne({ _id: new ObjectId(acc_id) })

        const signInRes = {
            redirect: false,
            acc_id: acc_id,
            designation_id: staffData?._doc?.designation,
            dvc_id: dvc_id,

            // Token Generation
            access_token: generateAccessToken(dvc_id, acc_id),
            refresh_token: generateRefreshToken(dvc_id, acc_id)
        }

        res.status(201).json(successResponse('Authentication Token OK', signInRes))

    } catch (error) {
        next(error)
    }
}

const rotateToken = async (req, res, next) => {
    try {
        const { refresh_token } = req.body

        if (!refresh_token) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        let decodedToken = null
        try {
            decodedToken = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);
        } catch (err) {
            return res.status(401).json(errorResponse('Authorization token is expired', 401));
        }

        if (!decodedToken) {
            return res.status(401).json(errorResponse('Invalid Authorization token', 401));
        }
   
        // Check active user
        const dvc_id = decodedToken.dvcId
        const acc_id = decodedToken.accId
        const user = await StaffModel.findOne({ _id: new ObjectId(acc_id), delete: { $ne: true } })

        if (!user) {
            return res.status(404).json(errorResponse('Invalid User Id', 404));
        }

        // Update Active Time
        await DeviceLogModel.updateOne({ dvc_id }, { $set: { last_active: new Date() } })

        const access_token = generateAccessToken(dvc_id, acc_id)

        res.status(201).json(successResponse('Token rotated', { access_token }))

    } catch (error) {
        next(error)
    }
}



module.exports = {
    doSignIn, generateToken, rotateToken
}

