const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const WorkModel = require('../models/work_model')
const DesignationModel = require('../models/designation_models');
const { YYYYMMDDFormat } = require('../helpers/dateUtils')
const { successResponse, errorResponse } = require('../helpers/response-helper')

const addRegularWork = async (req, res, next) => {
    try {
        const { designationId, regular_work } = req.body

        if (!designationId || !regular_work) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const designation = await DesignationModel.findOne({ _id: new ObjectId(designationId), delete: { $ne: true } })
        if (!designation) {
            return res.status(404).json(errorResponse('Invalid designation id', 404))
        }

        const newWork = await WorkModel.findOneAndUpdate({ designation: new ObjectId(designationId) }, {
            $set: {
                designation: designationId
            },
            $push: {
                works: { work: regular_work }
            }
        }, { upsert: true, new: true })

        if (!newWork) {
            return res.status(400).json(errorResponse('Try now !'))
        }

        res.status(201).json(successResponse('Regular work added', newWork.works[newWork.works.length - 1]))

    } catch (error) {
        next(error)
    }
}

const getAllWorksForUser = async (req, res, next) => {
    try {
        const { designation } = req.params

        const user = req.user.id
        const formattedDate = YYYYMMDDFormat(new Date());
        const userObjectId = ObjectId.isValid(user) ? new ObjectId(user) : null;

        const works = await WorkModel.aggregate([
            {
                $match: {
                    designation: new ObjectId(designation),
                    delete: { $ne: true }
                }
            },
            {
                $unwind: '$works'
            },
            {
                $lookup: {
                    from: 'staff_works_details',
                    let: { works: '$works.work', user: userObjectId },
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
                    designation: 1, work: '$works.work',
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
        const { designation } = req.query
        if (!designation) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const works = await WorkModel.findOne({ designation: new ObjectId(designation) })

        res.status(201).json(successResponse('Designation regular works', works?.works || []))


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

        let thisWork = await WorkModel.updateOne({
            'works.work': { $ne: work }, 'works._id': new ObjectId(work_Id)
        }, {
            $set: {
                'works.$.work': work
            }
        })
        if (thisWork?.modifiedCount <= 0) {
            return res.status(400).json(errorResponse('This work already exists', 400))
        }

        res.status(201).json({ status: true, message: 'This work updated' })

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

        const action = await WorkModel.updateOne({ 'works._id': new ObjectId(work_id) }, {
            $pull: {
                works: {
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