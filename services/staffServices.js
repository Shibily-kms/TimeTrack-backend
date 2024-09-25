const StaffAccountModel = require('../models/staff-account')


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