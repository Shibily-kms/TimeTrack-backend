const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const DeviceLogModel = require('../models/device-logs')
const { successResponse } = require('../helpers/response-helper')



const getUserDevices = async (req, res, next) => {
    try {

        const acc_id = req.params.accId

        const deviceList = await DeviceLogModel.aggregate([
            {
                $match: {
                    staff_id: new ObjectId(acc_id),
                    acc_type: 'staff',
                    $or: [
                        {
                            terminated: { $gte: new Date(new Date().setDate(new Date().getDate() - 2)) }
                        }, // Terminated within the last 2 days
                        {
                            terminated: { $not: { $type: 'date' } }, // If 'terminated' is not a date
                            last_active: { $gte: new Date(new Date().setDate(new Date().getDate() - 28)) }
                        } // Only check last_active if terminated is not a valid date
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        device_type: { $ifNull: ["$device_type", "Other Devices"] }
                    },
                    devices: {
                        $push: {
                            dvc_id: '$dvc_id',
                            os: '$os',
                            browser: '$browser',
                            // device: '$device',
                            geo: '$geo',
                            last_login: '$last_login',
                            last_active: '$last_active',
                            terminated: '$terminated',
                            sign_out: '$sign_out',
                            created_at: '$createdAt',
                            device_type: '$device_type'
                        }
                    }
                }
            },
            {
                $project: {
                    device_type: '$_id.device_type',
                    devices: 1,
                    count: { $size: '$devices' },
                    _id: 0
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ])

        res.status(201).json(successResponse('All Devices', deviceList))

    } catch (error) {
        next(error)
    }
}

const terminateDevice = async (req, res, next) => {
    try {

        const acc_id = req.params.accId
        const dvc_id = req.params.dvcId

        await DeviceLogModel.updateOne({ dvc_id, staff_id: new ObjectId(acc_id) }, {
            $set: {
                terminated: new Date()
            }
        })

        res.status(201).json(successResponse('Device terminated',))

    } catch (error) {
        next(error)
    }
}


module.exports = {
    getUserDevices, terminateDevice
}
