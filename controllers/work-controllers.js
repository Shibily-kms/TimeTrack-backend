const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const WorkModel = require('../models/work_model')
const { YYYYMMDDFormat } = require('../helpers/dateUtils')

const addRegularWork = async (req, res) => {
    try {
        const { designationId, regular_work } = req.body
        if (designationId && regular_work) {
            WorkModel.findOneAndUpdate({ designation: new ObjectId(designationId), 'works.work': { $ne: regular_work } }, {
                $set: {
                    designation: designationId
                },
                $push: {
                    works: { work: regular_work }
                }
            }, { upsert: true, new: true }).then((response) => {
                res.status(201).json({ status: true, work: response.works[response.works.length - 1], message: 'new work added' })
            }).catch((error) => {
                res.status(400).json({ status: false, message: 'this work exist' })
            })
        } else {
            res.status(400).json({ status: false, message: 'Must have pass body' })
        }
    } catch (error) {
        res.status(400).json({ status: false, message: 'try now' })
        throw error
    }
}

const getAllWorksForUser = (req, res) => {
    try {
        const { designation } = req.params
        const user = req.user.id
        const formattedDate = YYYYMMDDFormat(new Date());

        WorkModel.aggregate([
            {
                $match: {
                    designation: new ObjectId(designation)
                }
            },
            {
                $unwind: '$works'
            },
            {
                $lookup: {
                    from: 'staff_works_details',
                    let: { works: '$works', user: { $toObjectId: `${user}` } },
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
                    designation: 1, works: 1,
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
        ]).then((response) => {
            res.status(201).json({ status: true, works: response, message: 'all work today' })
        }).catch((error) => {
            res.status(400).json({ status: false, message: 'try now' })
        })

    } catch (error) {
        throw error;
    }
}

const getAllWorks = (req, res) => {
    try {
        const { designation } = req.params
        if (designation) {
            WorkModel.findOne({ designation: new ObjectId(designation) }).then((response) => {
                res.status(201).json({ status: true, works: response?.works || [], message: 'all works' })
            })
        } else {
            res.status(401).json({ status: false, message: "Pass designation Id" })
        }
    } catch (error) {
        throw error;
    }
}

const editRegularWork = (req, res) => {
    try {
        const { work_Id, work } = req.body
        if (work_Id && work) {
            WorkModel.updateOne({
                'works.work': { $ne: work }, 'works._id': new ObjectId(work_Id)
            }, {
                $set: {
                    'works.$.work': work
                }
            }).then((response) => {
                if (response?.modifiedCount > 0) {
                    res.status(201).json({ status: true, message: 'work updated' })
                } else {
                    res.status(400).json({ status: false, message: 'this work already existed' })
                }
            })
        } else {
            res.status(400).json({ status: false, message: 'Must have pass body' })
        }
    } catch (error) {
        throw error;
    }
}

const deleteRegularWork = (req, res) => {
    try {
        const { work_Id } = req.params
        WorkModel.updateOne({ 'works._id': new ObjectId(work_Id) }, {
            $pull: {
                works: {
                    _id: new ObjectId(work_Id)
                }
            }
        }).then((response) => {
            if (response.modifiedCount > 0) {
                res.status(201).json({ status: true, message: 'deleted' })
            } else {
                res.status(400).json({ status: false, message: 'Invalid work Id' })
            }
        })
    } catch (error) {
        throw error;
    }
}

module.exports = {
    addRegularWork, getAllWorksForUser, getAllWorks, editRegularWork, deleteRegularWork
}