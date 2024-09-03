const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const AccountModel = require('../models/account-model')
const axios = require('axios')
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { createRandomOTP } = require('../helpers/id-helper')


const sendSmsOtp = async (otp, mobile_number) => {
    await axios.get(`https://www.smsgatewayhub.com/api/mt/SendSMS?APIKey=${process.env.SMS_API_KEY}&senderid=${process.env.SMS_SENDER_ID_1}&channel=2&DCS=0&flashsms=0&number=${mobile_number}&text=Your OTP for Account authentication is ${otp}. Keep it confidential.-Alliance water solutions -&route=clickhere&EntityId=${process.env.SMS_ENT_ID}&dlttemplateid=${process.env.SMS_OTP_TEMP}`)
        .then((response) => {
            return true
        })
        .catch((error) => {
            return false
        })
}

// Exports

const sendOtp = async (req, res, next) => {
    try {
        const { country_code, mobile_number, way_type } = req.body

        if (!country_code || !mobile_number) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        if (mobile_number.length !== 10) {
            return res.status(409).json(errorResponse('Enter a valid 10-digit mobile number', 409))
        }

        if (!way_type === 'sms') {
            return res.status(409).json(errorResponse('This way OTP not setup', 409))
        }

        const accountData = await AccountModel.findOne({ 'primary_contact.number': mobile_number })
        const staffData = await StaffModel.findOne({ contact1: mobile_number })

        // This is Active Staff
        if (!staffData) {
            return res.status(409).json(errorResponse('Invalid Mobile Number.', 409))
        }

        // if send attempt over
        const nowTime = new Date();
        const beforeOneHr = new Date(new Date().setHours(new Date().getHours() - 1))

        if (accountData.otp_v.send_attempt > 2 &&
            (new Date(accountData.otp_v.otp_createdAt) < nowTime && new Date(accountData.otp_v.otp_createdAt) > beforeOneHr)) {
            return res.status(409).json(errorResponse('You have exceeded the maximum number of OTP requests. Please try again later.', 409))
        }

        // Resend Same OTP
        if (new Date(accountData.otp_v.otp_createdAt) > beforeOneHr) {

            await sendSmsOtp(accountData.otp_v.password, `91${mobile_number}`)
            await AccountModel.updateOne({ 'primary_contact.number': mobile_number }, { $inc: { 'otp_v.send_attempt': 1, } })
        }


        // First Time 
        if (!accountData || !accountData.otp_v || !accountData.otp_v.password
            || new Date(accountData?.otp_v?.otp_createdAt) < beforeOneHr) {
            const otp = createRandomOTP(6)

            await AccountModel.findOneAndUpdate({ 'primary_contact.number': mobile_number },
                {
                    $set: {
                        'otp_v.password': otp,
                        'otp_v.otp_createdAt': new Date(),
                        'otp_v.otp_expireAt': new Date(new Date().setMinutes(new Date().getMinutes() + 10)),
                        'otp_v.send_attempt': 1,
                        'otp_v.verify_attempt': 0,
                        'primary_contact.country_code': '91',
                        'primary_contact.number': mobile_number,
                        'primary_contact.sms': true
                    }
                },
                { upsert: true, new: true }
            )

            await sendSmsOtp(otp, `91${mobile_number}`)
        }

        res.status(201).json(successResponse('Otp Sended'))

    } catch (error) {
        next(error)
    }
}

const verifyOtp = async (req, res, next) => {
    try {
        const { country_code, mobile_number, way_type, otp } = req.body

        if (!country_code || !mobile_number || !otp) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        if (mobile_number.length !== 10) {
            return res.status(409).json(errorResponse('Enter a valid 10-digit mobile number', 409))
        }

        if (!way_type === 'sms') {
            return res.status(409).json(errorResponse('This way OTP not setup', 409))
        }

        const accountData = await AccountModel.findOne({ 'primary_contact.number': mobile_number })
        const staffData = await StaffModel.findOne({ contact1: mobile_number })

        // This is Active Staff
        if (!staffData) {
            return res.status(409).json(errorResponse('Invalid Mobile Number.', 409))
        }

        const nowTime = new Date();

        if (accountData) {
            await AccountModel.updateOne({ 'primary_contact.number': mobile_number }, { $inc: { 'otp_v.verify_attempt': 1, } })
        }

        // is Expired
        if (new Date(accountData.otp_v.otp_expireAt) < nowTime) {
            return res.status(409).json(errorResponse('This Otp is expired.', 409))
        }

        // Verify Otp
        if (accountData.otp_v.password !== otp) {
            return res.status(409).json(errorResponse('The OTP does not match.', 409))
        }

        await AccountModel.updateOne({ 'primary_contact.number': mobile_number }, {
            $set: {
                otp_v: {},
            }
        })

        res.status(201).json(successResponse('Otp Sended'))

    } catch (error) {
        next(error)
    }
}


module.exports = {
    sendOtp, verifyOtp
}