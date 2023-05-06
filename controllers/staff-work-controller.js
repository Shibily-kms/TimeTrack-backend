const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffWorksModel = require('../models/staff_works_model')
const { YYYYMMDDFormat } = require('../helpers/dateUtils')

const getLatestPunchDetails = async (req, res) => {
    try {
        const formattedDate = YYYYMMDDFormat(new Date());
        StaffWorksModel.findOne({ name: new ObjectId(req.user.id), date: formattedDate }, { regular_work: 0, extra_work: 0 }).
            select({ break: { $slice: -1 } }).then((response) => {
                if (response) {
                    response._doc.break = response.break[0]
                    res.status(201).json({ status: true, work_details: response, message: 'staff work details' })
                } else {
                    res.status(201).json({ status: true, work_details: {}, message: 'no currect details' })
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
                    let duration = parseInt(((endDate - response?.break?.[0]?.start) / 1000) / 60);
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
                }).then((respone) => {
                    res.status(201).json({ status: true, work: Obj, message: 'work completd' })
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
        from_date = new Date(from_date)
        to_date = new Date(to_date)
        StaffWorksModel.aggregate([
            {
                $match: {
                    punch_in: {
                        $gte: from_date,
                        $lt: to_date
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
                                                date: "$$work.start",
                                            }
                                        },
                                        end: {
                                            $dateToString: {
                                                format: "%H:%M:%S",
                                                date: "$$work.end",
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
                                                date: "$$work.start",
                                            }
                                        },
                                        end: {
                                            $dateToString: {
                                                format: "%H:%M:%S",
                                                date: "$$work.end",
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
                        _id: "$_id",
                        name: "$name",
                        staff_name: "$staff_name",
                        designation: "$designation",
                    },
                    dates: {
                        $push: {
                            date: "$date",
                            regular_work: "$regular_work",
                            extra_work: "$extra_work"
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


module.exports = {
    getLatestPunchDetails, doPunchIn, doPunchOut, doStartBreak, doEndBreak, doRegularWork, doExtraWork, getWorksData
}