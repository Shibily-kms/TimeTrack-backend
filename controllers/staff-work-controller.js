const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffWorksModel = require('../models/staff_works_model')
const { YYYYMMDDFormat } = require('../helpers/dateUtils')

const getLatestPunchDetails = async (req, res) => {
    try {
        const formattedDate = YYYYMMDDFormat(new Date());
        StaffWorksModel.findOne({ name: new ObjectId(req.user.id), date: formattedDate }, { regular_work: 0, extra_work: 0 })
            .then((response) => {
                if (response) {
                    response._doc.break = response.break.length > 0 ? response.break[response.break.length - 1] : null
                    response._doc.regular_work = response.regular_work ? response.regular_work : []
                    response._doc.extra_work = response.extra_work ? response.extra_work : []

                    res.status(201).json({ status: true, work_details: response, message: 'staff work details' })
                } else {
                    res.status(201).json({ status: true, work_details: {}, message: 'No current details' })
                }
            }).catch((error) => {
                res.status(400).json({ status: false, message: 'try now' })
            })
    } catch (error) {
        throw error
    }
}

const doPunchIn = (req, res) => {
    try {
        const formattedDate = YYYYMMDDFormat(new Date());

        StaffWorksModel.findOne({ name: new ObjectId(req.user.id), date: formattedDate }).then((data) => {
            if (data) {
                res.status(400).json({ status: false, message: 'already punch in' })
            } else {
                let staffWork = {
                    name: req.user.id,
                    punch_in: new Date(),
                    punch_out: null,
                    date: formattedDate,
                    regular_work: [],
                    break: [],
                    extra_work: []
                }

                StaffWorksModel.create(staffWork).then((response) => {
                    res.status(201).json({ status: true, work_details: response, message: 'punch in success' })
                }).catch((error) => {
                    res.status(400).json({ status: false, message: 'already exist' })
                })
            }
        })


    } catch (error) {
        throw error
    }
}

const doPunchOut = (req, res) => {
    try {
        StaffWorksModel.findById(req.body.id).then((response) => {
            if (response?.punch_out) {
                res.status(400).json({ status: false, message: 'already punch out' })
            } else {
                StaffWorksModel.findByIdAndUpdate(req.body.id, {
                    $set: {
                        punch_out: new Date()
                    }
                }, { new: true }).then((data) => {
                    res.status(201).json({ status: true, punch_out: data.punch_out, message: 'punch out success' })
                })
            }
        })
    } catch (error) {
        throw error
    }
}

const doStartBreak = (req, res) => {
    try {
        let { id } = req.body
        let WorkBreak = {
            start: new Date(),
            end: null,
            duration: 0
        }
        StaffWorksModel.findById(id).select({ break: { $slice: -1 } }).then((response) => {
            if (response?.break?.[0]?.start && !response?.break?.[0]?.end) {
                res.status(400).json({ status: false, message: 'You are on Allready Break' })
            } else {
                StaffWorksModel.findByIdAndUpdate(id, {
                    $push: {
                        break: WorkBreak
                    }
                }, { new: true }).then((data) => {
                    let lastBreak = data?.break.slice(-1)[0]
                    res.status(201).json({ status: true, break: lastBreak, message: 'break started' })
                })
            }
        })
    } catch (error) {
        throw error
    }
}

const doEndBreak = (req, res) => {
    try {
        const { id, break_id } = req.body

        StaffWorksModel.findOne({ _id: new ObjectId(id), break: { $elemMatch: { _id: new ObjectId(break_id) } } },
            { break: { $elemMatch: { _id: new ObjectId(break_id) } } }).then((response) => {

                if (response?.break?.[0]?.start && !response?.break?.[0]?.end) {
                    // get duration
                    let endDate = new Date()
                    let duration = parseInt((endDate - response?.break?.[0]?.start) / 1000);
                    // update
                    StaffWorksModel.findOneAndUpdate({ _id: new ObjectId(id), break: { $elemMatch: { _id: new ObjectId(break_id) } } },
                        {
                            $set: {
                                "break.$.end": endDate,
                                "break.$.duration": duration
                            }
                        }, { new: true }).then((data) => {
                            let lastBreak = data?.break.slice(-1)[0]
                            res.status(201).json({ status: true, break: lastBreak, message: 'break ended' })
                        })
                } else {
                    res.status(400).json({ status: false, message: 'You are not start break' })
                }
            })
    } catch (error) {
        throw error;
    }
}

const doRegularWork = (req, res) => {
    try {
        const { work, punch_id } = req.body
        StaffWorksModel.findById(punch_id).then((work_data) => {
            if (work_data) {
                const Obj = {
                    work,
                    start: new Date(),
                    end: new Date(),
                    duration: 0
                }
                StaffWorksModel.updateOne({ _id: new ObjectId(punch_id) }, {
                    $push: {
                        regular_work: Obj
                    }
                }).then((response) => {
                    res.status(201).json({ status: true, work: Obj, message: 'work completed' })
                })

            } else {
                res.status(400).json({ status: false, message: 'work data not found' })
            }
        })
    } catch (error) {
        throw error
    }
}

const doExtraWork = (req, res) => {
    try {
        const { work, punch_id } = req.body
        StaffWorksModel.findById(punch_id).then((work_data) => {
            if (work_data) {
                const Obj = {
                    work,
                    start: new Date(),
                    end: new Date(),
                    duration: 0
                }
                StaffWorksModel.updateOne({ _id: new ObjectId(punch_id) }, {
                    $push: {
                        extra_work: Obj
                    }
                }).then((respone) => {
                    res.status(201).json({ status: true, work: Obj, message: 'extra work added' })
                })

            } else {
                res.status(400).json({ status: false, message: 'work data not found' })
            }
        })
    } catch (error) {
        throw error
    }
}

const getWorksData = (req, res) => {
    try {
        let { from_date, to_date } = req.query
        StaffWorksModel.aggregate([
            {
                $match: {
                    date: {
                        $gte: from_date,
                        $lte: to_date
                    }
                }
            },
            {
                $lookup: {
                    from: 'staff_datas',
                    localField: 'name',
                    foreignField: '_id',
                    as: 'staff'
                }
            },
            {
                $lookup: {
                    from: 'existing_designations',
                    localField: 'staff.designation',
                    foreignField: '_id',
                    as: 'designation'
                }
            },
            {
                $project: {
                    staff_name: { $arrayElemAt: ['$staff.user_name', 0] },
                    designation: { $arrayElemAt: ['$designation.designation', 0] },
                    name: 1, date: 1,
                    punch_in: {
                        $dateToString: {
                            format: "%H:%M:%S",
                            date: {
                                $add: [
                                    "$punch_in",
                                    {
                                        $multiply: [
                                            (5 * 60 + 30) * 60 * 1000, // Convert 5 hours to milliseconds
                                            1 // Subtract the time difference from UTC to IST
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    punch_out: {
                        $dateToString: {
                            format: "%H:%M:%S",
                            date: {
                                $add: [
                                    "$punch_out",
                                    {
                                        $multiply: [
                                            (5 * 60 + 30) * 60 * 1000, // Convert 5 hours to milliseconds
                                            1 // Subtract the time difference from UTC to IST
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    duration: {
                        $round: {
                            $divide: [
                                { $subtract: ["$punch_out", "$punch_in"] },
                                1000
                            ]
                        }
                    },
                    regular_work: {
                        $map: {
                            input: "$regular_work",
                            as: "work",
                            in: {
                                $mergeObjects: [
                                    "$$work",
                                    {
                                        start: {
                                            $dateToString: {
                                                format: "%H:%M:%S",
                                                date: {
                                                    $add: [
                                                        "$$work.start",
                                                        {
                                                            $multiply: [
                                                                (5 * 60 + 30) * 60 * 1000, // Convert 5 hours to milliseconds
                                                                1 // Subtract the time difference from UTC to IST
                                                            ]
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        end: {
                                            $dateToString: {
                                                format: "%H:%M:%S",
                                                date: {
                                                    $add: [
                                                        "$$work.end",
                                                        {
                                                            $multiply: [
                                                                (5 * 60 + 30) * 60 * 1000, // Convert 5 hours to milliseconds
                                                                1 // Subtract the time difference from UTC to IST
                                                            ]
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    extra_work: {
                        $map: {
                            input: "$extra_work",
                            as: "work",
                            in: {
                                $mergeObjects: [
                                    "$$work",
                                    {
                                        start: {
                                            $dateToString: {
                                                format: "%H:%M:%S",
                                                date: {
                                                    $add: [
                                                        "$$work.start",
                                                        {
                                                            $multiply: [
                                                                (5 * 60 + 30) * 60 * 1000, // Convert 5 hours to milliseconds
                                                                1 // Subtract the time difference from UTC to IST
                                                            ]
                                                        }
                                                    ]
                                                },
                                            }
                                        },
                                        end: {
                                            $dateToString: {
                                                format: "%H:%M:%S",
                                                date: {
                                                    $add: [
                                                        "$$work.end",
                                                        {
                                                            $multiply: [
                                                                (5 * 60 + 30) * 60 * 1000, // Convert 5 hours to milliseconds
                                                                1 // Subtract the time difference from UTC to IST
                                                            ]
                                                        }
                                                    ]
                                                },
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    break: {
                        $map: {
                            input: "$break",
                            as: "break",
                            in: {
                                $mergeObjects: [
                                    "$$break",
                                    {
                                        start: {
                                            $dateToString: {
                                                format: "%H:%M:%S",
                                                date: {
                                                    $add: [
                                                        "$$break.start",
                                                        {
                                                            $multiply: [
                                                                (5 * 60 + 30) * 60 * 1000, // Convert 5 hours to milliseconds
                                                                1 // Subtract the time difference from UTC to IST
                                                            ]
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        end: {
                                            $dateToString: {
                                                format: "%H:%M:%S",
                                                date: {
                                                    $add: [
                                                        "$$break.end",
                                                        {
                                                            $multiply: [
                                                                (5 * 60 + 30) * 60 * 1000, // Convert 5 hours to milliseconds
                                                                1 // Subtract the time difference from UTC to IST
                                                            ]
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                }
            },
            {
                $group: {
                    _id: {
                        name: "$name",
                        staff_name: "$staff_name",
                        designation: "$designation",
                    },
                    dates: {
                        $push: {
                            date: "$date",
                            punch_in: '$punch_in', punch_out: '$punch_out',
                            duration: '$duration',
                            regular_work: "$regular_work",
                            extra_work: "$extra_work",
                            break: '$break'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: "$_id._id",
                    name: "$_id.name",
                    staff_name: "$_id.staff_name",
                    designation: "$_id.designation",
                    dates: 1
                }
            }
        ]).then((response) => {
            res.status(201).json({ status: true, work_data: response, message: 'all work data' })
        }).catch((error) => {
            res.status(400).json({ status: false, message: 'no data to match' })
        })
    } catch (error) {
        throw error;
    }
}

const doOfflineRecollection = async (req, res) => {
    try {
        let { _id, offBreak, extra_work, regular_work } = req.body
        let workData = await StaffWorksModel.findOne({ _id: new ObjectId(_id) })
        let alreadyExist = false
        let lastBreak = workData?.break.slice(-1)[0] || null

        // Check if already added
        if (regular_work?.[0]) {
            let check = workData.regular_work.filter((obj) => obj.work == regular_work[0].work)
            alreadyExist = check?.[0] ? true : false
        } else if (extra_work?.[0]) {
            let check = workData.extra_work.filter((obj) => obj.work == extra_work[0].work)
            alreadyExist = check?.[0] ? true : false
        } else if (offBreak?.[0]) {
            let check = workData.break.filter((obj) => {
                return obj.start.toISOString() == offBreak[0].start &&
                    (obj?.end?.toISOString() || null) == offBreak[0].end
            })
            alreadyExist = check?.[0] ? true : false
        }

        if (!alreadyExist) {
            let one = null
            offBreak = offBreak.filter((objs) => {
                if (objs.br_id) {
                    return objs
                } else {
                    one = objs
                }
            })
            if (one) {
                await StaffWorksModel.updateOne({ _id: new ObjectId(_id), 'break._id': new ObjectId(one._id) }, {
                    $set: {
                        "break.$.end": one.end,
                        "break.$.duration": one.duration
                    }
                })
            }
            if (offBreak?.[0] || extra_work?.[0] || regular_work?.[0]) {
                await StaffWorksModel.findByIdAndUpdate(_id, {
                    $push: {
                        break: { $each: offBreak },
                        extra_work: { $each: extra_work },
                        regular_work: { $each: regular_work }
                    }
                })
            }
            await StaffWorksModel.findById(_id).then((result) => {
                lastBreak = result?.break.slice(-1)[0]
            })
            res.status(201).json({ status: true, lastBreak, message: 'All data uploaded' })
        } else {
            res.status(429).json({ status: false, lastBreak, message: 'Already Updated' })
        }
    } catch (error) {
        throw error;
    }
}


module.exports = {
    getLatestPunchDetails, doPunchIn, doPunchOut, doStartBreak, doEndBreak, doRegularWork, doExtraWork, getWorksData,
    doOfflineRecollection
}