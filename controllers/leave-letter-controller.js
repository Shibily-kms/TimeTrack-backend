const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const LeaveAppModel = require('../models/leave-letter-model')
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { findLastNumber } = require('../helpers/id-helper')
const { leaveLetterValidation } = require('../helpers/validation-utils')


const getAllForUser = async (req, res, next) => {
    try {
        const { page, count } = req.query

        const allItems = await LeaveAppModel.find({ staff_id: new ObjectId(req.user.acc_id) }).sort({ reg_date_time: -1 }).skip((page - 1) * count).limit(count)
        const itemCount = await LeaveAppModel.find({ staff_id: new ObjectId(req.user.acc_id) }).count()

        res.status(201).json(successResponse('Get all leave letters', { list: allItems, count: itemCount }))

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
        const staffId = staff_id || req.user.acc_id

        if (!month) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const firstDayOfMonth = month + '-01'
        const lastDayOfMonth = month + '-31'

        const totalCount = await LeaveAppModel.aggregate([
            {
                $match: {
                    staff_id: new ObjectId(staffId),
                    leave_status: 'Approved',
                    approved_days: {
                        $elemMatch: {
                            0: {
                                $gte: firstDayOfMonth,
                                $lte: lastDayOfMonth
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    total_leave: {
                        $sum: {
                            $map: {
                                input: "$approved_days",
                                as: "day",
                                in: {
                                    $cond: {
                                        if: {
                                            $and: [
                                                { $gte: [{ $arrayElemAt: ["$$day", 0] }, firstDayOfMonth] },
                                                { $lte: [{ $arrayElemAt: ["$$day", 0] }, lastDayOfMonth] }
                                            ]
                                        },
                                        then: { $toDouble: { $arrayElemAt: ["$$day", 1] } },
                                        else: 0
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total_leave: { $sum: '$total_leave' }
                }
            }

        ])

        const TotalLeave = totalCount[0]?.total_leave || 0

        res.status(201).json(successResponse('Total This month leave', { total_leave: TotalLeave }))

    } catch (error) {
        next(error)
    }
}


//* V2
const applyLeave = async (req, res, next) => {
    try {
        const { requested_days, reason, comment } = req.body
        const acc_id = req.user.acc_id

        /** Requested_days formate
         * [
         * [date,type,start_time,end_time],
         * [2024-05-25,1,09:30,17:30],
         * [2024-05-26,.5,09:30,13:00],
         * ]
        */

        if (!requested_days[0] || !reason) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        // Validation
        const validation = leaveLetterValidation(requested_days)
        if (validation?.[0] === 'error') {
            return res.status(validation[1]).json(errorResponse(validation[2], validation[1]))
        }


        const tokenIndex = await findLastNumber('l2_token_index')
        const tokenId = 'L2#A' + tokenIndex.toString().padStart(5, '0')

        const insertObj = {
            token_id: tokenId,
            staff_id: acc_id,
            leave_status: 'Pending',
            reg_date_time: new Date(),
            requested_days: requested_days,
            leave_reason: reason,
            comment: comment || undefined
        }

        const leaveApplication = await LeaveAppModel.create(insertObj)

        res.status(201).json(successResponse('Leave applied', leaveApplication))

    } catch (error) {
        next(error)
    }
}

const leaveLetterList = async (req, res, next) => {
    try {

        const { page, limit, status, month } = req.query
        // active : action under 15 days
        const activePeriod = 15
        const count = Number(limit) || 10

        if ((!limit || !page) && status !== 'active' && !month) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        let matchStage = {}
        let additionalStages = []

        // If PAGE
        if (page && limit) {
            additionalStages = [
                {
                    $skip: (page - 1) * count
                },
                {
                    $limit: count
                }
            ]
        }

        // If Status === active
        if (status === 'active') {
            matchStage = {
                $nor: [
                    { action_date_time: { $lte: new Date(new Date().setDate(new Date().getDate() - activePeriod)) } },
                ]
            }
        }

        if (month) {
            const firstDayOfMonth = new Date(month + '01')
            const lastDayOfMonth = new Date(month + '31')

            matchStage = { reg_date_time: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } }
        }



        const TotalCount = await LeaveAppModel.find({ staff_id: new ObjectId(req.user.acc_id) }).count()
        const allItems = await LeaveAppModel.aggregate([
            {
                $match: {
                    staff_id: new ObjectId(req.user.acc_id),
                    ...matchStage
                }
            },
            {
                $lookup: {
                    from: 'staff_datas',
                    localField: 'staff_id',
                    foreignField: '_id',
                    as: 'applyUser'
                }
            },
            {
                $lookup: {
                    from: 'staff_datas',
                    localField: 'staff_id',
                    foreignField: '_id',
                    as: 'actionUser'
                }
            },
            {
                $project: {
                    token_id: 1,
                    leave_status: 1,
                    reg_date_time: 1,
                    requested_days: 1,
                    approved_days: 1,
                    self_action: 1,
                    staff_id: 1,
                    leave_reason: 1,
                    comment: 1,
                    action_date_time: 1,
                    full_name: {
                        $concat: [
                            { $arrayElemAt: ['$applyUser.first_name', 0] }, ' ', { $arrayElemAt: ['$applyUser.last_name', 0] }
                        ]
                    },
                    action_by: {
                        $concat: [
                            { $arrayElemAt: ['$actionUser.first_name', 0] }, ' ', { $arrayElemAt: ['$actionUser.last_name', 0] }
                        ]
                    }
                }
            },
            {
                $sort: {
                    reg_date_time: -1
                }
            },
            ...additionalStages
        ])

        res.status(201).json(successResponse('Leave letters', { count: TotalCount, list: allItems }))

    } catch (error) {
        next(error)
    }
}

const leaveLetterListAdmin = async (req, res, next) => {
    try {

        const { page, limit, status, month, staff_id } = req.query
        // active : action under 15 days
        const activePeriod = 15
        const count = Number(limit) || 10

        if ((!limit || !page) && status !== 'active' && !month) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        let matchStage = {}
        let additionalStages = []

        // If PAGE
        if (page && limit) {
            additionalStages = [
                {
                    $skip: (page - 1) * count
                },
                {
                    $limit: count
                }
            ]
        }

        // If Status === active
        if (status === 'active') {
            matchStage = {
                $nor: [
                    { action_date_time: { $lte: new Date(new Date().setDate(new Date().getDate() - activePeriod)) } },
                ]
            }
        }

        if (month) {
            const firstDayOfMonth = new Date(month + '01')
            const lastDayOfMonth = new Date(month + '31')

            matchStage = { reg_date_time: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } }
        }

        if (staff_id) {
            matchStage.staff_id = new ObjectId(staff_id)
        }

        const TotalCount = await LeaveAppModel.find({ staff_id: new ObjectId(req.user.acc_id) }).count()
        const allItems = await LeaveAppModel.aggregate([
            {
                $match: matchStage
            },
            {
                $lookup: {
                    from: 'staff_datas',
                    localField: 'staff_id',
                    foreignField: '_id',
                    as: 'applyUser'
                }
            },
            {
                $lookup: {
                    from: 'staff_datas',
                    localField: 'staff_id',
                    foreignField: '_id',
                    as: 'actionUser'
                }
            },
            {
                $project: {
                    token_id: 1,
                    leave_status: 1,
                    reg_date_time: 1,
                    requested_days: 1,
                    approved_days: 1,
                    self_action: 1,
                    staff_id: 1,
                    leave_reason: 1,
                    comment: 1,
                    action_date_time: 1,
                    full_name: {
                        $concat: [
                            { $arrayElemAt: ['$applyUser.first_name', 0] }, ' ', { $arrayElemAt: ['$applyUser.last_name', 0] }
                        ]
                    },
                    action_by: {
                        $concat: [
                            { $arrayElemAt: ['$actionUser.first_name', 0] }, ' ', { $arrayElemAt: ['$actionUser.last_name', 0] }
                        ]
                    }
                }
            },
            {
                $sort: {
                    reg_date_time: -1
                }
            },
            ...additionalStages
        ])

        res.status(201).json(successResponse('Leave letters', { count: TotalCount, list: allItems }))

    } catch (error) {
        next(error)
    }
}

const approveLeaveApplication = async (req, res, next) => {
    try {
        const { _id, days } = req.body

        if (!_id || !days[0]) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const updateAction = await LeaveAppModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                leave_status: 'Approved',
                approved_days: days,
                action_date_time: new Date(),
                action_by: new ObjectId(req.user.acc_id)
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
                action_date_time: new Date(),
                action_by: new ObjectId(req.user.acc_id)
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

const cancelLeaveApplication = async (req, res, next) => {
    try {
        const { _id } = req.query
        const acc_id = req.user.acc_id

        if (!_id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const updateAction = await LeaveAppModel.updateOne({ _id: new ObjectId(_id), staff_id: new ObjectId(acc_id) }, {
            $set: {
                leave_status: 'Cancelled',
                action_date_time: new Date(),
                self_action: true,
                action_by: new ObjectId(req.user.acc_id)
            }
        })

        if (updateAction.modifiedCount < 1) {
            return res.status(404).json(errorResponse('Invalid Token Id', 404))
        }

        res.status(201).json(successResponse('Cancelled'))

    } catch (error) {
        next(error)
    }
}

const cancelLeaveApplicationAdmin = async (req, res, next) => {
    try {
        const { _id } = req.query

        if (!_id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const updateAction = await LeaveAppModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                leave_status: 'Cancelled',
                action_date_time: new Date(),
                action_by: new ObjectId(req.user.acc_id)
            }
        })

        if (updateAction.modifiedCount < 1) {
            return res.status(404).json(errorResponse('Invalid token Id', 404))
        }

        res.status(201).json(successResponse('Cancelled'))

    } catch (error) {
        next(error)
    }
}


module.exports = {
    applyLeave, getAllForUser, cancelLeaveApplication, getAllForAdmin, totalMonthLeave,
    approveLeaveApplication, rejectLeaveApplication, leaveLetterList, leaveLetterListAdmin,
    cancelLeaveApplicationAdmin
}