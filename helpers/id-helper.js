const AdminModel = require("../models/admin-models");

function createRandomId(sting_length, addition = "") {
    const numbers = '123456789ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    let randomString = '';
    for (let i = 0; i < sting_length; i++) {
        randomString += numbers.charAt(Math.floor(Math.random() * numbers.length))
    }
    return addition + randomString
}

function createRandomOTP(sting_length, addition = "") {
    const numbers = '1234567890'
    let randomString = '';
    for (let i = 0; i < sting_length; i++) {
        randomString += numbers.charAt(Math.floor(Math.random() * numbers.length))
    }
    return addition + randomString
}


// const Id HELPER
const findLastNumber = async (access_label) => {
    const purifierAdminData = await AdminModel.findOne({ access_key: "Staff" })
    const newNumber = purifierAdminData?.[access_label] + 1 || 1
    await AdminModel.updateOne({ access_key: "Staff" },
        { $set: { [access_label]: Number(newNumber) } },
        { upsert: true }
    )

    return newNumber
}

const deviceIdBuilder = () => {
    const sting_length = 32;
    const numbers = '123456789ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    let randomString = '';
    for (let i = 0; i < sting_length; i++) {
        randomString += numbers.charAt(Math.floor(Math.random() * numbers.length))
    }
    return randomString
}


module.exports = { createRandomId, findLastNumber, createRandomOTP, deviceIdBuilder }