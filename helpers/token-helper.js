const jwt = require('jsonwebtoken')
const maxAge = 60    // 5hr

const generateAccessToken = (dvcId, accId) => {
    const token = jwt.sign({ dvcId, accId }, process.env.ACCESS_TOKEN, { expiresIn: maxAge });
    return token
}

const generateRefreshToken = (dvcId, accId) => {
    const token = jwt.sign({ dvcId, accId }, process.env.REFRESH_TOKEN);
    return token
}

module.exports = { generateAccessToken, generateRefreshToken }


