const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')

const verifyAdmin = (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            const token = req.headers.authorization.split(' ')[1];
            const jwtToken = jwt.verify(token, process.env.TOKEN_KEY)

            if (!token) {
                res.status(401)
                throw new Error('No token');
            }

            if (jwtToken) {
                next()
            } else {
                res.status(400).json({ status: false, message: 'admin token expired' })
            }
        }

    } catch (error) {
        return res.status(401).json({ status: false, message: 'Log in again now!' })
    }
}
const verifyUser = async (req, res, next) => {
    try {

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {

            const token = req.headers.authorization.split(' ')[1];
            const jwtToken = jwt?.verify(token, process.env.TOKEN_KEY)

            if (!token) {
                res.status(401)
                throw new Error('No token');
            }

            if (jwtToken) {
                const user_id = jwtToken.user
                const user = await StaffModel.findOne({ _id: new ObjectId(user_id), delete: { $ne: true } })
                if (!user) {
                    throw new Error('Log in again now!');
                } else {
                    req.user = {
                        id: user_id,
                    }
                    next()
                }

                // if (Date.now() >= decodedToken.exp * 1000) {
                //     // Token has expired, renew the token
                //     const renewedToken = jwt.sign({ /* payload */ }, 'your-secret-key', { expiresIn: '1h' });

                //     // Attach the renewed token to the response headers
                //     res.setHeader('Authorization', renewedToken);
                //   }

            } else {
                throw new Error('Invalid token');
            }


        }

    } catch (error) {
        return res.status(401).json({ status: false, message: 'Log in again now!' })
    }
}


module.exports = { verifyAdmin, verifyUser } 