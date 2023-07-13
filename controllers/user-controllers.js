const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const DesignationModel = require('../models/designation_models')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


const doSignUp = async (req, res) => {
    try {

        let exist = await StaffModel.findOne({ user_name: req.body.user_name })

        if (exist) {
            res.status(400).json({ status: false, message: 'This user-name existed' })
        } else {
            let body = req.body
            body.password = await bcrypt.hash(body.password, 10)
            body.delete = false
            StaffModel.create(body).then((response) => {
                if (response) {
                    DesignationModel.updateOne({ _id: req.body.designation }
                        , {
                            $push: {
                                name: response._id
                            }
                        }
                    ).then((result) => {
                        res.status(201).json({ status: true, message: 'user sign up success' })
                    })
                }
            }).catch((error) => {
                res.status(400).json({ success: false, message: 'User Sign up not completed , try now' })
            })
        }
    } catch (error) {
        throw error
    }
}

const doLogin = async (req, res) => {
    try {
        const maxAge = 1000 * 60 * 60 * 24 * 30
        const { user_name, password } = req.body;
        const user = await StaffModel.findOne({ user_name, delete: { $ne: true } })
        if (user) {
            let password_check = await bcrypt.compare(password, user.password);
            if (password_check) {
                const designation_details = await DesignationModel.findById({ _id: user.designation })
                const token = jwt.sign({ user: user._id }, process.env.TOKEN_KEY, { expiresIn: maxAge })
                delete user._doc.password
                user._doc.token = token
                user._doc.designation = {
                    id: designation_details._id,
                    designation: designation_details.designation,
                    allow_sales: designation_details.allow_sales || false,
                    auto_punch_out: designation_details.auto_punch_out || '17:30'
                }
                res.status(201).json({ status: true, user, message: 'login success' })
            } else {
                res.status(400).json({ status: false, message: 'incorrect password' })
            }
        } else {
            res.status(400).json({ status: false, message: 'invalid user name' })
        }

    } catch (error) {
        throw error
    }
}

const getAllStaffs = (req, res) => {
    try {
        StaffModel.find({ delete: { $ne: true } }, { user_name: 1, contact: 1, designation: 1 }).
            populate('designation', 'designation').then((response) => {
                res.status(201).json({ status: true, staffs: response, message: 'all staffs' })
            })
    } catch (error) {
        throw error;
    }
}

const deleteStaff = (req, res) => {
    try {
        const { id } = req.params
        StaffModel.updateOne({ _id: new ObjectId(id) }, {
            $set: {
                delete: true
            }
        }).then((response) => {
            if (response?.modifiedCount > 0) {
                res.status(201).json({ status: true, message: 'Deleted' })
            } else {
                res.status(400).json({ status: false, message: 'Delete failed' })
            }
        }).catch((error) => {
            res.status(400).json({ status: false, message: 'Delete failed' })
        })
    } catch (error) {
        throw error;
    }
}

module.exports = {
    doSignUp, doLogin, getAllStaffs, deleteStaff
}