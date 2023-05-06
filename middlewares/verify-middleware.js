const jwt = require('jsonwebtoken')

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
        throw error;
    }
}
const verifyUser = async (req, res, next) => {
    try {

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {

            const token = req.headers.authorization.split(' ')[1];
            const jwtToken = jwt?.verify(token, process.env.TOKEN_KEY)

            if (jwtToken) {
                const user_id = jwtToken.user
                req.user = {
                    id: user_id,
                }
                next()

            } else {
                return res.status(400).json({ status: false, message: 'Invalid token' })
            }

            if (!token) {
                res.status(401)
                throw new Error('No token');
            }
        }

    } catch (error) {
        throw error;
    }
}


module.exports = { verifyAdmin, verifyUser } 