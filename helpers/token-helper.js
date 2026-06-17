const jwt = require('jsonwebtoken')
const maxAge = 60 * 60 * 5  // 5hr

const generateAccessToken = (dvcId, accId, workerUuid) => {
    const token = jwt.sign({ dvcId, accId, workerUuid }, process.env.ACCESS_TOKEN, { expiresIn: maxAge });
    return token
}

const generateRefreshToken = (dvcId, accId, workerUuid) => {
    const token = jwt.sign({ dvcId, accId, workerUuid }, process.env.REFRESH_TOKEN);
    return token
}

module.exports = { generateAccessToken, generateRefreshToken }


