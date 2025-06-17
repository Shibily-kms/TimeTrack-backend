const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const DeviceLogModel = require('../models/device-logs')
const { successResponse, errorResponse } = require('../helpers/response-helper')



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

const terminateAllInactiveDevices = async (req, res, next) => {
    try {
        const { currentDvcId } = req.query
        const { accId } = req.params

        if (!currentDvcId) {
            return res.status(409).json(errorResponse('Current device id is missing', 409))
        }

        // Verify
        const allOpenDevices = await DeviceLogModel.find({
            staff_id: new ObjectId(accId),
            acc_type: 'staff',
            terminated: { $not: { $type: 'date' } },
        })

        if (allOpenDevices?.length < 1) {
            return res.status(404).json(errorResponse('No open devices', 404))
        }

        let inactiveTerminate = 0, activeTerminate = 0

        // Terminate all inactive devices
        const terminateInactive = await DeviceLogModel.updateMany({
            staff_id: new ObjectId(accId),
            acc_type: 'staff',
            dvc_id: { $ne: currentDvcId },
            terminated: { $not: { $type: 'date' } },
            last_active: { $lte: new Date(new Date().setDate(new Date().getDate() - 28)) }
        }, {
            $set: {
                terminated: new Date()
            }
        })

        inactiveTerminate = terminateInactive.modifiedCount || 0

        // terminate in active , above 4
        const allActiveDevices = await DeviceLogModel.find({
            staff_id: new ObjectId(accId),
            acc_type: 'staff',
            dvc_id: { $ne: currentDvcId },
            terminated: { $not: { $type: 'date' } },
            last_active: { $gte: new Date(new Date().setDate(new Date().getDate() - 28)) }
        }).sort({ last_active: 1 })



        if (allActiveDevices?.length > 3) {
            for (let index = 0; index < allActiveDevices.length - 3; index++) {

                // terminate singles
                await DeviceLogModel.updateOne({
                    staff_id: new ObjectId(accId),
                    acc_type: 'staff',
                    dvc_id: allActiveDevices?.[index]?.dvc_id,
                }, {
                    $set: {
                        terminated: new Date()
                    }
                })

                activeTerminate++

            }
        }

        res.status(200).json(successResponse('Termination completed', { inactiveTerminate: inactiveTerminate, activeTerminate: inactiveTerminate }, 200))

    } catch (error) {
        next(error)
    }
}


module.exports = {
    getUserDevices, terminateDevice, terminateAllInactiveDevices
}
