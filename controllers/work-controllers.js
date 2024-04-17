const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const WorkTodoModel = require('../models/work_todo_list')
const { YYYYMMDDFormat } = require('../helpers/dateUtils')
const { successResponse, errorResponse } = require('../helpers/response-helper')

const addRegularWork = async (req, res, next) => {
    try {
        const { staffId, title, type, days, self } = req.body
        const owner_id = staffId || req.user.id

        if (!owner_id || !title || !type) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        // Find already exists
        const findDuplicate = await WorkTodoModel.findOne({
            owner_id: new ObjectId(owner_id),
            title
        })

        if (findDuplicate) {
            return res.status(400).json(errorResponse('This work already exists'))
        }

        // Add to DB
        const newWork = await WorkTodoModel.create({
            owner_type: 'staff_work',
            owner_id: new ObjectId(owner_id),
            title,
            repeat_type: type,
            interval: type === 'daily' ? 1 : undefined,
            weekly: type === 'weekly' ? days : undefined,
            monthly: type === 'monthly' ? days : undefined,
            start_date: new Date(),
            self_start: self || false
        })

        res.status(201).json(successResponse('Regular work added', newWork))

    } catch (error) {
        next(error)
    }
}

const getAllWorksForUser = async (req, res, next) => {
    try {

        const user = req.user.id
        const formattedDate = YYYYMMDDFormat(new Date());
        const userObjectId = ObjectId.isValid(user) ? new ObjectId(user) : null;

        const allWorks = await WorkTodoModel.aggregate([
            {
                $match: {
                    owner_id: new ObjectId(user),
                    owner_type: 'staff_work'
                }
            },
            {
                $lookup: {
                    from: 'staff_works_details',
                    let: { works: '$title', user: userObjectId },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$date', `${formattedDate}`] },
                                        { $eq: ['$name', "$$user"] },
                                        { $in: ["$$works", "$regular_work.work"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                regular_work: {
                                    $first: {
                                        $filter: {
                                            input: '$regular_work',
                                            as: 'rw',
                                            cond: { $eq: ["$$rw.work", "$$works"] }
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    as: 'that'
                }
            },
            {
                $project: {
                    title: 1,
                    repeat_type: 1,
                    weekly: 1,
                    monthly: 1,
                    start_date: 1,
                    self_start: 1,
                    interval: 1,
                    finished: {
                        $first: {
                            $map: {
                                input: "$that",
                                as: "t",
                                in: {
                                    $cond: {
                                        if: { $eq: [{ $type: "$$t.regular_work.end" }, "date"] },
                                        then: true,
                                        else: false
                                    }
                                }
                            }
                        }
                    },
                    do_time: {
                        $first: {
                            $map: {
                                input: "$that",
                                as: "t",
                                in: {
                                    $cond: {
                                        if: { $isArray: "$$t.regular_work.end" },
                                        then: { $arrayElemAt: ["$$t.regular_work.end", 0] },
                                        else: "$$t.regular_work.end"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ])

        if (!allWorks) {
            return res.status(400).json(errorResponse('Try now !'))
        }

        res.status(201).json(successResponse('Today all works', allWorks))

    } catch (error) {
        next(error)
    }
}

const getAllWorks = async (req, res, next) => {
    try {
        const { staffId } = req.query
        if (!staffId) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const works = await StaffModel.findOne({ _id: new ObjectId(staffId) }, { regular_works: 1 })

        res.status(201).json(successResponse('Staff regular works', works?.regular_works || []))


    } catch (error) {
        next(error)
    }
}

const editRegularWork = async (req, res, next) => {
    try {
        const { work_Id, title, type, days } = req.body

        if (!work_Id || !title || !type) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        let thisWork = await WorkTodoModel.findOneAndUpdate({
             _id: new ObjectId(work_Id)
        }, {
            $set: {
                title,
                repeat_type: type,
                interval: type === 'daily' ? 1 : 0,
                weekly: type === 'weekly' ? days : [],
                monthly: type === 'monthly' ? days : [],
                start_date: new Date()
            }
        }, { new: true })

        if (!thisWork) {
            return res.status(400).json(errorResponse('This work already exists', 400))
        }

        res.status(201).json(successResponse('This work updated', thisWork))

    } catch (error) {
        next(error)
    }
}

const deleteRegularWork = async (req, res, next) => {
    try {
        const { work_id } = req.query

        if (!work_id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const action = await StaffModel.updateOne({ 'regular_works._id': new ObjectId(work_id) }, {
            $pull: {
                regular_works: {
                    _id: new ObjectId(work_id)
                }
            }
        })
        if (action.modifiedCount <= 0) {
            return res.status(400).json(errorResponse('Incorrect work Id'))
        }

        res.status(201).json(successResponse('Regular work deleted'))

    } catch (error) {
        next(error)
    }
}

module.exports = {
    addRegularWork, getAllWorksForUser, getAllWorks, editRegularWork, deleteRegularWork
}