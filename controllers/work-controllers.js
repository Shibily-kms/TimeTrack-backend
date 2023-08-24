const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffModel = require('../models/staff-model')
const { YYYYMMDDFormat } = require('../helpers/dateUtils')
const { successResponse, errorResponse } = require('../helpers/response-helper')

const addRegularWork = async (req, res, next) => {
    try {
        const { staffId, regular_work } = req.body

        if (!staffId || !regular_work) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const newWork = await StaffModel.findOneAndUpdate({
            _id: new ObjectId(staffId),
            'regular_works.work_name': { $ne: regular_work }
        }, {
            $push: {
                regular_works: { work_name: regular_work }
            }
        }, { new: true })

        if (!newWork) {
            return res.status(400).json(errorResponse('This work already exists'))
        }

        res.status(201).json(successResponse('Regular work added', newWork.regular_works[newWork.regular_works.length - 1]))

    } catch (error) {
        next(error)
    }
}

const getAllWorksForUser = async (req, res, next) => {
    try {

        const user = req.user.id
        const formattedDate = YYYYMMDDFormat(new Date());
        const userObjectId = ObjectId.isValid(user) ? new ObjectId(user) : null;

        const works = await StaffModel.aggregate([
            {
                $match: {
                    _id: new ObjectId(user),
                    delete: { $ne: true }
                }
            },
            {
                $unwind: '$regular_works'
            },
            {
                $lookup: {
                    from: 'staff_works_details',
                    let: { works: '$regular_works.work_name', user: userObjectId },
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
                    work: '$regular_works.work_name',
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
                    }
                }
            }
        ])

        if (!works) {
            return res.status(400).json(errorResponse('Try now !'))
        }

        res.status(201).json(successResponse('Today all works', works))

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
        const { work_Id, work } = req.body

        if (!work_Id || !work) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        let thisWork = await StaffModel.updateOne({
            'regular_works.work_name': { $ne: work }, 'regular_works._id': new ObjectId(work_Id)
        }, {
            $set: {
                'regular_works.$.work_name': work
            }
        })
        if (thisWork?.modifiedCount <= 0) {
            return res.status(400).json(errorResponse('This work already exists', 400))
        }

        res.status(201).json(successResponse('This work updated'))

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