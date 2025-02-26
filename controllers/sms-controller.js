const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const StaffAccountModel = require('../models/staff-account')
const axios = require('axios')
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { createRandomOTP } = require('../helpers/id-helper')
const { findStaffByPrimaryNumber, findStaffByAccId } = require('../services/staffServices')
const whatsappApiService = require('../services/whatsappAPI');


const sendSmsOtpAPI = async (otp, mobile_number, otpFor) => {
    await axios.get(`https://www.smsgatewayhub.com/api/mt/SendSMS?APIKey=${process.env.SMS_API_KEY}&senderid=${process.env.SMS_SENDER_ID_1}&channel=2&DCS=0&flashsms=0&number=${mobile_number}&text=Your OTP for ${otpFor} is ${otp}. Keep it confidential.-Alliance water solutions -&route=clickhere&EntityId=${process.env.SMS_ENT_ID}&dlttemplateid=${process.env.SMS_OTP_TEMP}`)
        .then(() => {
            return true
        })
        .catch(() => {
            return false
        })
}

const sendOtpToReceiver = async (acc_id, country_code, mobile_number, way_type) => {
    try {
        const otp = createRandomOTP(6)
        if (way_type === 'sms') {
            await sendSmsOtpAPI(otp, `${country_code}${mobile_number}`, 'Account authentication')
        }

        if (way_type === 'whatsapp') {
            whatsappApiService.sendTemplateMessages({
                templateName: 'verify_code_1',
                templateLgCode: 'en_US',
                components: [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "text": otp
                            }
                        ]
                    },
                    {
                        "type": "button",
                        "sub_type": "url",
                        "index": 0,
                        "parameters": [
                            {
                                "type": "text",
                                "text": otp
                            }
                        ]
                    }
                ],
                recipientWhList: [`${country_code}${mobile_number}`]
            })
        }

        await StaffAccountModel.updateOne({ acc_id },
            {
                $set: {
                    'otp_v.password': otp,
                    'otp_v.otp_createdAt': new Date(),
                    'otp_v.otp_expireAt': new Date(new Date().setMinutes(new Date().getMinutes() + 10)),
                    'otp_v.send_attempt': 1,
                    'otp_v.verify_attempt': 0
                }
            })

    } catch (error) {
        throw error
    }
}

const resendOtpToReceiver = async (acc_id, otp, country_code, mobile_number, way_type) => {
    try {
        if (way_type === 'sms') {
            await sendSmsOtpAPI(otp, `${country_code}${mobile_number}`, 'Account authentication')
        }

        if (way_type === 'whatsapp') {
            whatsappApiService.sendTemplateMessages({
                templateName: 'verify_code_1',
                templateLgCode: 'en_US',
                components: [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "text": otp
                            }
                        ]
                    },
                    {
                        "type": "button",
                        "sub_type": "url",
                        "index": 0,
                        "parameters": [
                            {
                                "type": "text",
                                "text": otp
                            }
                        ]
                    }
                ],
                recipientWhList: [`${country_code}${mobile_number}`]
            })
        }

        await StaffAccountModel.updateOne({ acc_id }, { $inc: { 'otp_v.send_attempt': 1, } })

    } catch (error) {
        throw error
    }
}

// Exports

const sendOtp = async (req, res, next) => {
    try {
        const { acc_id, country_code, mobile_number, way_type, by_number, by_acc } = req.body

        if (!country_code || !mobile_number) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        if (!acc_id && by_acc) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        if (mobile_number.length < 7) {
            return res.status(409).json(errorResponse('Enter valid country mobile number formate', 409))
        }

        if (!['sms', 'whatsapp']?.includes(way_type)) {
            return res.status(409).json(errorResponse('This way OTP not setup', 409))
        }

        let accountData = null

        if (by_number) {
            accountData = await findStaffByPrimaryNumber(country_code, mobile_number)
        }

        if (by_acc) {
            accountData = await findStaffByAccId(acc_id)
        }

        // This is Active Staff
        if (!accountData) {
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
            await resendOtpToReceiver(accountData._doc.acc_id, accountData._doc.otp_v.password, country_code, mobile_number, way_type)
        }

        // First Time 
        if (!accountData._doc.otp_v || !accountData._doc.otp_v.password
            || new Date(accountData._doc?.otp_v?.otp_createdAt) < beforeOneHr) {

            await sendOtpToReceiver(accountData._doc.acc_id, country_code, mobile_number, way_type)
        }

        res.status(201).json(successResponse('Otp Sended'))

    } catch (error) {
        next(error)
    }
}

const verifyOtp = async (req, res, next) => {
    try {
        const { acc_id, way_type, country_code, mobile_number, otp, by_number, by_acc } = req.body

        if (!otp) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        if (by_number && (!country_code || !mobile_number)) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        if (by_acc && !acc_id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        if (!['sms', 'whatsapp']?.includes(way_type)) {
            return res.status(409).json(errorResponse('This way OTP not setup', 409))
        }


        let accountData = null

        if (by_number) {
            accountData = await findStaffByPrimaryNumber(country_code, mobile_number)
        }

        if (by_acc) {
            accountData = await findStaffByAccId(acc_id)
        }


        // This is Active Staff
        if (!accountData) {
            return res.status(409).json(errorResponse('Invalid account ID.', 409))
        }

        const nowTime = new Date();

        if (accountData) {
            await StaffAccountModel.updateOne({

            },
                { $inc: { 'otp_v.verify_attempt': 1, } })
        }

        // is Expired
        if (new Date(accountData._doc.otp_v.otp_expireAt) < nowTime) {
            return res.status(409).json(errorResponse('This Otp is expired.', 409))
        }

        // Verify Otp
        if (accountData._doc.otp_v.password !== otp) {
            return res.status(409).json(errorResponse('The OTP does not match.', 409))
        }

        await StaffAccountModel.updateOne(
            { acc_id: accountData._doc.acc_id, dropped_account: { $ne: true } },
            { $set: { otp_v: {}, } }
        )

        res.status(201).json(successResponse('Otp Sended'))

    } catch (error) {
        next(error)
    }
}


module.exports = {
    sendOtp, verifyOtp, sendOtpToReceiver
}