// const db = require('../config/db')
// const collection = require('../config/collections')
const jwt = require('jsonwebtoken')

const postLogin = (req, res) => {
    const admin = {
        EMAIL: process.env.ADMIN_EMAIL,
        USER_NAME: process.env.ADMIN_USER_NAME,
        PASSWORD: process.env.ADMIN_PASSWORD
    }
    const maxAge = 60 * 60 * 24 * 30;
    console.log(req.body);
    const { user_name, password } = req.body
    if (admin.USER_NAME === user_name) {
        if (admin.PASSWORD === password) {
            const token = jwt.sign({ user_name: admin.USER_NAME }, process.env.TOKEN_KEY, { expiresIn: maxAge })
            res.status(201).json({ status: true, admin: { ...admin, token }, message: 'Success' })
        } else {
            res.status(400).json({ status: false, message: 'Incorrect Password' })
        }
    } else {
        res.status(400).json({ status: false, message: 'Invalid User name' })
    }
}

module.exports = {
    postLogin
}