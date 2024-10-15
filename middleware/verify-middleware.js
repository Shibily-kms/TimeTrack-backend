const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const StaffAccountModel = require('../models/staff-account')
const DeviceLogModel = require('../models/device-logs')
const { errorResponse } = require('../helpers/response-helper')

const verifyToken = async (req, res, next) => {
    try {
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
            return res.status(401).json(errorResponse('Authorization token not provided', 401))
        }

        const token = req.headers.authorization.split(' ')[1];
        let decodedToken = null
        try {
            decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN);
        } catch (err) {
            return res.status(401).json(errorResponse('Authorization token is expired', 401));
        }

        if (!decodedToken) {
            return res.status(401).json(errorResponse('Invalid Authorization token', 401));
        }

        if (Date.now() >= decodedToken.exp * 1000) {
            return res.status(401).json(errorResponse('Authorization token is expired', 401));
        }

        // Check active user
        const dvc_id = decodedToken.dvcId
        const acc_id = decodedToken.accId
        const user = await StaffModel.findOne({ _id: new ObjectId(acc_id), delete: { $ne: true } })
        const device = await DeviceLogModel.findOne({ dvc_id })

        if (!user || device?.terminated) {
            return res.status(401).json(errorResponse('Invalid Authorization token', 401));
        } else if (!device) {
            return res.status(403).json(errorResponse('Invalid Authorization token', 403));
        }

        // Update Active Time
        await DeviceLogModel.updateOne({ dvc_id }, { $set: { last_active: new Date() } })

        req.user = {
            acc_id: acc_id,
            dvc_id: dvc_id
        };
        next();
    } catch (error) {
        throw error
    }
}

const verifyOrigin = (acCodes = []) => {
    return async (req, res, next) => {
        try {

            if (!acCodes[0] && typeof acCodes !== 'object') {
                throw Error('Access origin code not provided')
            }

            const accountData = await StaffAccountModel.findOne({ acc_id: new ObjectId(req.user.acc_id), dropped_account: { $ne: true } })

            if (!accountData) {
                return res.status(404).json(errorResponse('Invalid User Id', 404));
            }

            if (acCodes.some(key => accountData.allowed_origins.includes(key))) {
                next()
            } else {
                return res.status(404).json(errorResponse('Origin access denied ', 404))
            }
        } catch (error) {
            throw error
        }
    }
}

module.exports = { verifyToken, verifyOrigin } 