const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const WorkModel = require('../models/work_model')

const addRegularWork = async (req, res) => {
    try {
        const { designation, regular_work } = req.body

        WorkModel.findOneAndUpdate({ designation: new ObjectId(designation), works: { $nin: [regular_work] } }, {
            $set: {
                designation
            },
            $push: {
                works: regular_work
            }
        }, { upsert: true, new: true }).then(() => {
            res.status(201).json({ status: true, message: 'new work added' })
        }).catch((error) => {
            res.status(400).json({ status: false, message: 'this work exist' })
        })
    } catch (error) {
        res.status(400).json({ status: false, message: 'try now' })
        throw error
    }
}

const getAllWorksForUser = (req, res) => {
    try {
        const { designation } = req.params
        const user = req.user.id
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

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


module.exports = {
    addRegularWork, getAllWorksForUser
}