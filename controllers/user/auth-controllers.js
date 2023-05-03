const UserModel = require('../../models/user-model')
const DesignationModel = require('../../models/designation_models')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


const doSignUp = async (req, res) => {
    try {
       
        let exist = await UserModel.findOne({ user_name: req.body.user_name })
       
        if (exist) {
            res.status(400).json({ status: false, message: 'This user-name exist' })
        } else {
            let body = req.body
            body.password = await bcrypt.hash(body.password, 10)
            UserModel.create(body).then((response) => {
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

    }
}


module.exports = {
    doSignUp
}