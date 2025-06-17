const { YYYYMMDDFormat } = require('../helpers/dateUtils')
const DeviceLogModel = require('../models/device-logs')
const StaffAccountModel = require('../models/staff-account')
const StaffModel = require('../models/staff-model')
const whatsappApiService = require('./whatsappAPI')


module.exports.findStaffByPrimaryNumber = async (countryCode, mobileNumber) => {
    try {
        const userData = await StaffAccountModel.findOne({
            'primary_number.country_code': countryCode,
            'primary_number.number': mobileNumber,
            dropped_account: { $ne: true }

        })

        return userData

    } catch (error) {
        throw error
    }
}

module.exports.findStaffByAccId = async (accId) => {
    try {
        const userData = await StaffAccountModel.findOne({
            acc_id: accId,
            dropped_account: { $ne: true }
        })

        return userData

    } catch (error) {
        throw error
    }
}

module.exports.staffDataVerificationStatus = async (acc_id) => {
    try {

        // Define the fields to validate with their error messages
        const fieldsToValidate = [
            { key: 'first_name', error: 'First name is missing' },
            { key: 'last_name', error: 'Last name is missing' },
            { key: 'dob', error: 'Date of birth is missing' },
            { key: 'gender', error: 'Gender is missing' },
            { key: 'address', error: 'Address is missing' },
            { key: 'place', error: 'Place is missing' },
            { key: 'pin_code', error: 'Pin / Zip Code is missing' },
            { key: 'district', error: 'District is missing' },
            { key: 'state', error: 'State is missing' },
            { key: 'blood_group', error: 'Blood group is missing' },
            { key: 'primary_number', error: 'Primary number is missing' },
            { key: 'pn_verification', error: 'Primary number verification not completed' },
            { key: 'official_number', error: 'Official number is missing' },
            { key: 'on_verification', error: 'Official number verification not completed' },
            { key: 'whatsapp_number', error: 'Whatsapp number is missing' },
            { key: 'wn_verification', error: 'Whatsapp number verification not completed' },
            { key: 'email_address', error: 'Email address is missing' },
            { key: 'designation', error: 'Designation is missing' },
            { key: 'sid', error: 'Staff ID is missing' },
            { key: 'salary', error: 'Salary is missing' },
            { key: 'working_days', error: 'Working days is missing' },
            { key: 'working_time', error: 'Working time is missing' },
            { key: 'join_date', error: 'Join date is missing' },
            { key: 'work_mode', error: 'Work model is missing' },
            { key: 'e_type', error: 'Employee type is missing' },
            { key: 'password_update', error: 'Password security is weak' },
            { key: 'number_of_sessions', error: 'Session' }
        ];

        const staffData = await StaffModel.findOne({ _id: acc_id })
        const accountData = await StaffAccountModel.findOne({ acc_id })
        const deviceList = await DeviceLogModel.find({ staff_id: acc_id, terminated: { $exists: false } })

        let total = 27, completed = 0, pending = 0, percentage = 0, report = {}

        const dataObj = {
            first_name: staffData?.first_name || null,
            last_name: staffData?.last_name || null,
            dob: staffData?.dob || null,
            gender: staffData?.gender || null,
            address: staffData?.address?.address || null,
            place: staffData?.address?.place || null,
            pin_code: staffData?.address?.pin_code || null,
            district: staffData?.address?.district || null,
            state: staffData?.address?.state || null,
            blood_group: staffData?.blood_group || null,
            primary_number: accountData?.primary_number?.number || null,
            pn_verification: accountData?.primary_number?.verified || null,
            official_number: staffData?.official_number?.number || null,
            on_verification: staffData?.official_number?.verified || null,
            whatsapp_number: staffData?.whatsapp_number?.number || null,
            wn_verification: staffData?.whatsapp_number?.verified || null,
            email_address: accountData?.email_address?.mail || null,
            designation: staffData?.designation || null,
            sid: staffData?.sid || null,
            salary: staffData?.current_salary || null,
            working_days: staffData?.current_working_days || null,
            working_time: staffData?.current_working_time || null,
            join_date: staffData?.join_date || null,
            work_mode: staffData?.work_mode || null,
            e_type: staffData?.e_type || null,
            password_update: accountData?.last_tp_changed || null,
            number_of_sessions: deviceList?.length,
        }

        fieldsToValidate.forEach(({ key, error }) => {

            // Sessions
            if (key === 'number_of_sessions') {
                if (dataObj?.[key] > 4) {
                    pending++;
                    report[key] = 'Your account has exceeded 4 active sessions.';
                } else {
                    completed++;
                    report[key] = 'Ok';
                }

                return;
            }

            if (dataObj?.[key]) {
                completed++;
                report[key] = 'Ok';

            } else {
                pending++;
                report[key] = error;
            }
        });

        percentage = parseInt((completed / total) * 100)

        return { completed, pending, percentage, report }

    } catch (error) {
        throw error
    }
}

module.exports.autoWhatsappMessageToStaff = async () => {
    try {
        const allStaff = await StaffModel.find({ delete: { $ne: true } })

        allStaff?.map(async (staff) => {

            const whatsapp_number = `${staff?.whatsapp_number?.country_code}${staff?.whatsapp_number?.number}`
            const getRandomNumber = Math.floor(Math.random() * 3) + 1
            const staffName = `${staff?.first_name} ${staff?.last_name}`
            const years = new Date().getFullYear() - new Date(staff?.join_date).getFullYear()


            // date of birth
            if (new Date(staff?.dob).getDate() === new Date().getDate() &&
                new Date(staff?.dob).getMonth() === new Date().getMonth()) {

                await whatsappApiService.sendTemplateMessages({
                    templateName: `staff_hbd_wish_${getRandomNumber || 1}`,
                    templateLgCode: 'en',
                    components: [
                        {
                            "type": "body",
                            "parameters": [
                                {
                                    "type": "text",
                                    "text": staffName
                                }
                            ]
                        }
                    ],
                    recipientWhList: [whatsapp_number]
                })
            }

            // join date
            if (new Date(staff?.join_date).getDate() === new Date().getDate() &&
                new Date(staff?.join_date).getMonth() === new Date().getMonth() &&
                years > 0) {

                await whatsappApiService.sendTemplateMessages({
                    templateName: `staff_works_wish_${getRandomNumber || 1}`,
                    templateLgCode: 'en',
                    components: [
                        {
                            "type": "body",
                            "parameters": [
                                {
                                    "type": "text",
                                    "text": years === 1 ? years + 'st' : years === 2 ? years + 'nd' :
                                        years === 3 ? years + 'rd' : years + "th"
                                },
                                {
                                    "type": "text",
                                    "text": staffName
                                }
                            ]
                        }
                    ],
                    recipientWhList: [whatsapp_number]
                })
            }
        })

    } catch (error) {
        throw error
    }
}