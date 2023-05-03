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
                res.status(400).json({ status: false,  message: 'admin token expired' })
            }
        }

    } catch (error) {
        throw error;
    }
}


module.exports = { verifyAdmin } 