const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const LeaveAppModel = require('../models/leave-letter-model')
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { findLastNumber } = require('../helpers/id-helper')


const registerLeave = async (req, res, next) => {
    try {
        const { leave_type, from_date, reason } = req.body

        if (typeof leave_type !== 'number' || !from_date || !reason) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const tokenIndex = await findLastNumber('l2_token_index')
        const tokenId = 'L2#A' + tokenIndex.toString().padStart(5, '0')
        const betweenDays = Math.round((new Date(req.body.end_date) - new Date(from_date)) / (1000 * 60 * 60 * 24)) + 1

        const insertObj = {
            token_id: tokenId,
            staff_id: req.user.id,
            leave_status: 'Pending',
            reg_date_time: new Date(),
            leave_type: leave_type ? 'Full' : 'Half',
            apply_leave: {
                from_date: from_date,
                to_date: leave_type ? req?.body?.end_date : from_date,
                days: leave_type ? betweenDays : .5  // .5 === 0.5
            },
            leave_reason: reason,
            comment: req.body.comment
        }

        const leaveApplication = await LeaveAppModel.create(insertObj)

        res.status(201).json(successResponse('Leave application success', leaveApplication))

    } catch (error) {
        next(error)
    }
}

const getAllForUser = async (req, res, next) => {
    try {
        const { page, count } = req.query

        const allItems = await LeaveAppModel.find({ staff_id: new ObjectId(req.user.id) }).sort({ reg_date_time: -1 }).skip((page - 1) * count).limit(count)
        const itemCount = await LeaveAppModel.find({ staff_id: new ObjectId(req.user.id) }).count()

        res.status(201).json(successResponse('Get all leave letters', { list: allItems, count: itemCount }))

    } catch (error) {
        next(error)
    }
}

const cancelLeaveApplication = async (req, res, next) => {
    try {
        const { _id, self_cancel } = req.query

        if (!_id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const updateAction = await LeaveAppModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                leave_status: 'Cancelled',
                cancelled_date_time: new Date(),
                self_cancel: self_cancel === 'yes'
            }
        })

        if (updateAction.modifiedCount < 1) {
            return res.status(404).json(errorResponse('Invalid objectId', 404))
        }

        res.status(201).json(successResponse('Cancelled'))

    } catch (error) {
        next(error)
    }
}

const approveLeaveApplication = async (req, res, next) => {
    try {
        const { _id, from_date, to_date, leave_type } = req.body

        if (!_id || !from_date) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const betweenDays = Math.round((new Date(to_date) - new Date(from_date)) / (1000 * 60 * 60 * 24)) + 1

        const updateAction = await LeaveAppModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                leave_status: 'Approved',
                approved_leave: {
                    from_date: from_date,
                    to_date: leave_type === 'Full' ? req?.body?.to_date : from_date,
                    days: leave_type === 'Full' ? betweenDays : .5  // .5 === 0.5
                },
                approved_date_time: new Date()
            }
        })

        if (updateAction.modifiedCount < 1) {
            return res.status(404).json(errorResponse('Invalid objectId', 404))
        }

        res.status(201).json(successResponse('Approved'))

    } catch (error) {
        next(error)
    }
}

const rejectLeaveApplication = async (req, res, next) => {
    try {
        const { _id } = req.body

        if (!_id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const updateAction = await LeaveAppModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                leave_status: 'Rejected',
                rejected_date_time: new Date()
            }
        })

        if (updateAction.modifiedCount < 1) {
            return res.status(404).json(errorResponse('Invalid objectId', 404))
        }

        res.status(201).json(successResponse('Rejected'))

    } catch (error) {
        next(error)
    }
}

const getAllForAdmin = async (req, res, next) => {
    try {
        const allItems = await LeaveAppModel.aggregate([
            {
                $match: {
                    $nor: [
                        { approved_date_time: { $lte: new Date(new Date().setDate(new Date().getDate() - 5)) } },
                        { rejected_date_time: { $lte: new Date(new Date().setDate(new Date().getDate() - 5)) } },
                        { cancelled_date_time: { $lte: new Date(new Date().setDate(new Date().getDate() - 5)) } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'staff_datas',
                    localField: 'staff_id',
                    foreignField: '_id',
                    as: 'staff'
                }
            },
            {
                $project: {
                    token_id: 1,
                    leave_status: 1,
                    reg_date_time: 1,
                    leave_type: 1,
                    apply_leave: 1,
                    approved_leave: 1,
                    self_cancel: 1,
                    staff_id: 1,
                    leave_reason: 1,
                    comment: 1,
                    approved_date_time: 1,
                    rejected_date_time: 1,
                    cancelled_date_time: 1,
                    full_name: {
                        $concat: [
                            { $arrayElemAt: ['$staff.first_name', 0] },
                            ' ',
                            { $arrayElemAt: ['$staff.last_name', 0] }
                        ]
                    }
                }
            },
            {
                $sort: {
                    reg_date_time: -1
                }
            }
        ])

        res.status(201).json(successResponse('Get all leave letters', allItems))

    } catch (error) {
        next(error)
    }
}

const totalMonthLeave = async (req, res, next) => {
    try {
        const { staff_id, month } = req.query
        const staffId = staff_id || req.user.id

        if (!month) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }
        let takeMonth = new Date(month)

        const firstDayOfMonth = new Date(takeMonth.getFullYear(), takeMonth.getMonth(), 1)
        const lastDayOfMonth = new Date(takeMonth.getFullYear(), takeMonth.getMonth() + 1, 0)

        const totalCount = await LeaveAppModel.aggregate([
            {
                $match: {
                    reg_date_time: {
                        $gte: firstDayOfMonth,
                        $lte: lastDayOfMonth
                    },
                    leave_status: 'Approved',
                    staff_id: new ObjectId(staffId)
                }
            },
            {
                $project: {
                    total_leave: {
                        $sum: "$approved_leave.days"
                    }
                }
            }
        ])

        const TotalLeave = totalCount[0]?.total_leave || 0

        res.status(201).json(successResponse('Total This month leave', { total_leave: TotalLeave }))

    } catch (error) {
        next(error)
    }
}

module.exports = {
    registerLeave, getAllForUser, cancelLeaveApplication, getAllForAdmin, totalMonthLeave,
    approveLeaveApplication, rejectLeaveApplication
}