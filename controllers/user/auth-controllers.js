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

const doLogin = async (req, res) => {
    try {
        const maxAge = 60 * 60 * 24 * 30
        const { user_name, password } = req.body;
        const user = await UserModel.findOne({ user_name })
        if (user) {
            let password_check = await bcrypt.compare(password, user.password);
            if (password_check) {
                const designation_details = await DesignationModel.findById({ _id: user.designation })
                const token = jwt.sign({ user: user._id }, process.env.TOKEN_KEY, { expiresIn: maxAge })
                delete user._doc.password
                user._doc.token = token
                user._doc.designation = designation_details.designation
                res.status(201).json({ status: true, user, message: 'login success' })
            } else {
                res.status(400).json({ status: false, message: 'incorrect password' })
            }
        } else {
            res.status(400).json({ status: false, message: 'invalid user name' })
        }


    } catch (error) {

    }
}


module.exports = {
    doSignUp, doLogin
}