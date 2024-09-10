const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const StaffAccountModel = require('../models/staff-account')
const axios = require('axios')
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { createRandomOTP } = require('../helpers/id-helper')


const sendSmsOtpAPI = async (otp, mobile_number, otpFor) => {
    await axios.get(`https://www.smsgatewayhub.com/api/mt/SendSMS?APIKey=${process.env.SMS_API_KEY}&senderid=${process.env.SMS_SENDER_ID_1}&channel=2&DCS=0&flashsms=0&number=${mobile_number}&text=Your OTP for ${otpFor} is ${otp}. Keep it confidential.-Alliance water solutions -&route=clickhere&EntityId=${process.env.SMS_ENT_ID}&dlttemplateid=${process.env.SMS_OTP_TEMP}`)
        .then(() => {
            return true
        })
        .catch(() => {
            return false
        })
}

const sendSmsWayText = async (country_code, mobile_number) => {
    try {
        const otp = createRandomOTP(6)
        await StaffAccountModel.updateOne({ 'primary_number.country_code': country_code, 'primary_number.number': mobile_number },
            {
                $set: {
                    'otp_v.password': otp,
                    'otp_v.otp_createdAt': new Date(),
                    'otp_v.otp_expireAt': new Date(new Date().setMinutes(new Date().getMinutes() + 10)),
                    'otp_v.send_attempt': 1,
                    'otp_v.verify_attempt': 0
                }
            })

        await sendSmsOtpAPI(otp, `${country_code}${mobile_number}`, 'Account authentication')

    } catch (error) {
        throw error
    }
}

const resendSmsWayText = async (otp, country_code, mobile_number) => {
    try{
        await sendSmsOtpAPI(otp, `${country_code}${mobile_number}`, 'Account authentication')
        await StaffAccountModel.updateOne({
            'primary_number.country_code': country_code,
            'primary_number.number': mobile_number
        }, { $inc: { 'otp_v.send_attempt': 1, } })

    }catch(error){
        throw error
    }
}

// Exports

const sendOtp = async (req, res, next) => {
    try {
        const { country_code, mobile_number, way_type } = req.body

        if (!country_code || !mobile_number) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        if (mobile_number.length < 7) {
            return res.status(409).json(errorResponse('Enter valid country mobile number formate', 409))
        }

        if (!way_type === 'sms') {
            return res.status(409).json(errorResponse('This way OTP not setup', 409))
        }

        const accountData = await StaffAccountModel.findOne({
            'primary_number.country_code': country_code,
            'primary_number.number': mobile_number,
            dropped_account: { $ne: true }
        })

        const staffData = await StaffModel.findOne({ _id: new ObjectId(accountData._doc.acc_id) })

        // This is Active Staff
        if (!accountData || !staffData) {
            return res.status(409).json(errorResponse('Invalid Mobile Number.', 409))
        }

        // if send attempt over
        const nowTime = new Date();
        const beforeOneHr = new Date(new Date().setHours(new Date().getHours() - 1))

        if (accountData._doc.otp_v.send_attempt > 2 &&
            (new Date(accountData._doc.otp_v.otp_createdAt) < nowTime && new Date(accountData._doc.otp_v.otp_createdAt) > beforeOneHr)) {
            return res.status(409).json(errorResponse('You have exceeded the maximum number of OTP requests. Please try again later.', 409))
        }

        // Resend Same OTP
        if (new Date(accountData._doc.otp_v.otp_createdAt) > beforeOneHr) {
            await resendSmsWayText(accountData._doc.otp_v.password, country_code, mobile_number)
        }

        // First Time 
        if (!accountData._doc.otp_v || !accountData._doc.otp_v.password
            || new Date(accountData._doc?.otp_v?.otp_createdAt) < beforeOneHr) {

            await sendSmsWayText(country_code, mobile_number)
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

        if (mobile_number.length < 7) {
            return res.status(409).json(errorResponse('Enter valid country mobile number formate', 409))
        }

        if (!way_type === 'sms') {
            return res.status(409).json(errorResponse('This way OTP not setup', 409))
        }

        const accountData = await StaffAccountModel.findOne({
            'primary_number.country_code': country_code,
            'primary_number.number': mobile_number,
            dropped_account: { $ne: true }
        })
        const staffData = await StaffModel.findOne({ _id: new ObjectId(accountData.acc_id) })

        // This is Active Staff
        if (!accountData || !staffData) {
            return res.status(409).json(errorResponse('Invalid Mobile Number.', 409))
        }

        const nowTime = new Date();

        if (accountData) {
            await StaffAccountModel.updateOne({
                'primary_number.country_code': country_code,
                'primary_number.number': mobile_number,
                dropped_account: { $ne: true }
            },
                { $inc: { 'otp_v.verify_attempt': 1, } })
        }

        // is Expired
        if (new Date(accountData.otp_v.otp_expireAt) < nowTime) {
            return res.status(409).json(errorResponse('This Otp is expired.', 409))
        }

        // Verify Otp
        if (accountData.otp_v.password !== otp) {
            return res.status(409).json(errorResponse('The OTP does not match.', 409))
        }

        await StaffAccountModel.updateOne({
            'primary_number.country_code': country_code,
            'primary_number.number': mobile_number,
            dropped_account: { $ne: true }
        }, {
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
    sendOtp, verifyOtp, sendSmsWayText
}