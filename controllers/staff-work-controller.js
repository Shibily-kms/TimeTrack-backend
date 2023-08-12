const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffWorksModel = require('../models/staff_works_model')
const { YYYYMMDDFormat } = require('../helpers/dateUtils')
const { successResponse, errorResponse } = require('../helpers/response-helper')


const getLatestPunchDetails = async (req, res, next) => {
    try {
        const formattedDate = YYYYMMDDFormat(new Date());
        let todayDetails = await StaffWorksModel.findOne({ name: new ObjectId(req.user.id), date: formattedDate }, { regular_work: 0, extra_work: 0 })
        if (!todayDetails) {
            return res.status(201).json(successResponse('No today details', {}))
        }

        todayDetails._doc.break = todayDetails.break.length > 0 ? todayDetails.break[todayDetails.break.length - 1] : null
        todayDetails._doc.regular_work = todayDetails.regular_work ? todayDetails.regular_work : []
        todayDetails._doc.extra_work = todayDetails.extra_work ? todayDetails.extra_work : []

        res.status(201).json(successResponse('Today work data', todayDetails))

    } catch (error) {
        next(error)
    }
}

//* Punch 
const doPunchIn = async (req, res, next) => {
    try {
        const { designation } = req.body
        if (!designation) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const formattedDate = YYYYMMDDFormat(new Date());

        const todayPunchData = await StaffWorksModel.findOne({ name: new ObjectId(req.user.id), date: formattedDate })
        if (todayPunchData) {
            return res.status(400).json(errorResponse('Already punched'))
        }

        let punchObj = {
            name: req.user.id,
            punch_in: new Date(),
            punch_out: null,
            date: formattedDate,
            designation
        }

        const response = await StaffWorksModel.create(punchObj)
        if (!response) {
            return res.status(400).json(errorResponse('Try now !'))
        }

        res.status(201).json(successResponse('Punch in success', response))

    } catch (error) {
        next(error)
    }
}

const doPunchOut = async (req, res, next) => {
    try {
        const { id } = req.body

        if (!id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const todayWork = await StaffWorksModel.findById(id).select({ break: { $slice: -1 } })
        if (todayWork?.punch_out) {
            return res.status(400).json(errorResponse('Already punch out'))
        }

        if (!(todayWork?.lunch_break?.start && todayWork?.lunch_break?.end ||
            !todayWork?.lunch_break?.start && !todayWork?.lunch_break?.end)) {
            return res.status(400).json(errorResponse('You are on a break'))
        }

        if (!(todayWork?.break?.[0]?.start && todayWork?.break?.[0]?.end ||
            !todayWork?.break?.[0]?.start && !todayWork?.break?.[0]?.end)) {
            return res.status(400).json(errorResponse('You are on a break'))
        }

        const result = await StaffWorksModel.findByIdAndUpdate(req.body.id, {
            $set: {
                punch_out: new Date(),
                auto_punch_out: false
            }
        }, { new: true })

        res.status(201).json(successResponse('Punch out success', { punch_out: result.punch_out }))

    } catch (error) {
        next(error)
    }
}

const doAutoPunchOut = (name) => {
    return new Promise(async (resolve, reject) => {
        try {
            const date = YYYYMMDDFormat(new Date())
            await StaffWorksModel.updateMany({ name: { $in: name }, date, punch_out: null }, [{
                $addFields: {
                    punch_out: new Date(),
                    auto_punch_out: true,
                    break: {
                        $map: {
                            input: "$break",
                            as: "item",
                            in: {
                                $cond: [
                                    { $eq: ["$$item.end", null] },
                                    {
                                        $mergeObjects: [
                                            "$$item",
                                            {
                                                end: new Date(),
                                                duration: {
                                                    $toInt: {
                                                        $divide: [
                                                            { $subtract: [new Date(), "$$item.start"] },
                                                            1000 // Convert milliseconds to seconds (if needed)
                                                        ]
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    "$$item"
                                ]
                            }
                        }
                    },
                    lunch_break: {
                        $cond: [
                            { $eq: ["$lunch_break.end", null] },
                            {
                                $mergeObjects: [
                                    "$lunch_break",
                                    {
                                        end: new Date(),
                                        duration: {
                                            $toInt: {
                                                $divide: [
                                                    { $subtract: [new Date(), "$lunch_break.start"] },
                                                    1000 // Convert milliseconds to seconds (if needed)
                                                ]
                                            }
                                        }
                                    }
                                ]
                            },
                            "$lunch_break"
                        ]
                    }
                }
            }])
            resolve()

        } catch (error) {
            reject(error)
        }
    })
}




// * Over Time
const doStartOverTime = async (req, res, next) => {
    try {
        const { id } = req.body

        if (!id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const todayWork = await StaffWorksModel.findOne({ _id: new ObjectId(id) })

        if (!todayWork?.punch_out) {
            return res.status(400).json(errorResponse('Must have Punched Out'))
        }

        if (todayWork?.over_time?.in) {
            return res.status(400).json(errorResponse('Over time already started'))
        }

        await StaffWorksModel.updateOne({ _id: new ObjectId(id) }, {
            $set: {
                over_time: {
                    in: new Date(),
                    out: null
                }
            }
        })

        res.status(201).json(successResponse('Over time Started'))

    } catch (error) {
        next(error)
    }
}

const doStopOverTime = async (req, res, next) => {
    try {
        const { id } = req.body

        if (!id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const todayWork = await StaffWorksModel.findById(id).select({ break: { $slice: -1 } })
        if (todayWork?.over_time.out) {
            return res.status(400).json(errorResponse('Already over time closed'))
        }

        if (!(todayWork?.lunch_break?.start && todayWork?.lunch_break?.end ||
            !todayWork?.lunch_break?.start && !todayWork?.lunch_break?.end)) {
            return res.status(400).json(errorResponse('You are on a break'))
        }

        if (!(todayWork?.break?.[0]?.start && todayWork?.break?.[0]?.end ||
            !todayWork?.break?.[0]?.start && !todayWork?.break?.[0]?.end)) {
            return res.status(400).json(errorResponse('You are on a break'))
        }

        await StaffWorksModel.updateOne({ _id: new ObjectId(id) }, {
            $set: {
                "over_time.out": new Date(),
                "over_time.auto": false
            }
        })

        res.status(201).json(successResponse('Over time Stopped'))

    } catch (error) {
        next(error)
    }
}

const doAutoOverTimeOut = (name) => {
    return new Promise(async (resolve, reject) => {
        try {

            await StaffWorksModel.updateMany({ name: { $in: name }, "over_time.in": { $exists: true }, "over_time.out": null }, [{
                $addFields: {
                    'over_time.out': new Date(),
                    'over_time.auto': true,
                    break: {
                        $map: {
                            input: "$break",
                            as: "item",
                            in: {
                                $cond: [
                                    { $eq: ["$$item.end", null] },
                                    {
                                        $mergeObjects: [
                                            "$$item",
                                            {
                                                end: new Date(),
                                                duration: {
                                                    $toInt: {
                                                        $divide: [
                                                            { $subtract: [new Date(), "$$item.start"] },
                                                            1000 // Convert milliseconds to seconds (if needed)
                                                        ]
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    "$$item"
                                ]
                            }
                        }
                    },
                    lunch_break: {
                        $cond: [
                            { $eq: ["$lunch_break.end", null] },
                            {
                                $mergeObjects: [
                                    "$lunch_break",
                                    {
                                        end: new Date(),
                                        duration: {
                                            $toInt: {
                                                $divide: [
                                                    { $subtract: [new Date(), "$lunch_break.start"] },
                                                    1000 // Convert milliseconds to seconds (if needed)
                                                ]
                                            }
                                        }
                                    }
                                ]
                            },
                            "$lunch_break"
                        ]
                    }
                }
            }])
            resolve()

        } catch (error) {
            reject(error)
        }
    })
}

//* Break
const doStartBreak = async (req, res, next) => {
    try {

        let { id } = req.body
        if (!id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const todayWork = await StaffWorksModel.findById(id).select({ break: { $slice: -1 } })

        if (!(todayWork?.punch_in && !todayWork?.punch_out || todayWork?.over_time?.in && !todayWork?.over_time?.out)) {
            return res.status(400).json(errorResponse('Cannot start the break, Try now !'))
        }

        if (!(todayWork?.lunch_break?.start && todayWork?.lunch_break?.end ||
            !todayWork?.lunch_break?.start && !todayWork?.lunch_break?.end)) {
            return res.status(400).json(errorResponse('You are already on lunch break'))
        }

        if (!(todayWork?.break?.[0]?.start && todayWork?.break?.[0]?.end ||
            !todayWork?.break?.[0]?.start && !todayWork?.break?.[0]?.end)) {
            return res.status(400).json(errorResponse('You are already on break'))
        }

        const WorkBreak = {
            start: new Date(),
            end: null,
            duration: 0
        }

        const response = await StaffWorksModel.findByIdAndUpdate(id, {
            $push: { break: WorkBreak }
        }, { new: true })

        const lastBreak = response?.break.slice(-1)[0]

        res.status(201).json(successResponse('Break started', lastBreak))

    } catch (error) {
        next(error)
    }
}

const doEndBreak = async (req, res, next) => {
    try {
        const { id, break_id } = req.body

        if (!id || !break_id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const todayWork = await StaffWorksModel.findOne({ _id: new ObjectId(id), break: { $elemMatch: { _id: new ObjectId(break_id) } } },
            { punch_out: 1, punch_in: 1, over_time: 1, break: { $elemMatch: { _id: new ObjectId(break_id) } } })

        if (!(todayWork?.punch_in && !todayWork?.punch_out || todayWork?.over_time?.in && !todayWork?.over_time?.out)) {
            return res.status(400).json(errorResponse('Cannot start the break, Try now !'))
        }

        if (!(todayWork?.break?.[0]?.start && !todayWork?.break?.[0]?.end)) {
            return res.status(400).json(errorResponse('You are not start any break'))
        }

        // get duration
        const endDate = new Date()
        const duration = parseInt((endDate - todayWork?.break?.[0]?.start) / 1000);
        // update
        const result = await StaffWorksModel.findOneAndUpdate({ _id: new ObjectId(id), break: { $elemMatch: { _id: new ObjectId(break_id) } } },
            {
                $set: {
                    "break.$.end": endDate,
                    "break.$.duration": duration
                }
            }, { new: true })

        const lastBreak = result?.break.slice(-1)[0]

        res.status(201).json(successResponse('Break ended', lastBreak))

    } catch (error) {
        next(error)
    }
}

//* Work
const doRegularWork = async (req, res, next) => {
    try {
        const { work, punch_id } = req.body

        if (!work || !punch_id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const todayWork = await StaffWorksModel.findById(punch_id).select({ break: { $slice: -1 } })
        if (!todayWork?.punch_in || (todayWork?.punch_out && !todayWork?.over_time?.in) || todayWork?.over_time?.out) {
            return res.status(409).json(errorResponse('Cannot check the work, Try now !', 409))
        }

        const Obj = {
            work,
            start: new Date(),
            end: new Date(),
            duration: 0
        }

        const doWork = await StaffWorksModel.updateOne({ _id: new ObjectId(punch_id), 'regular_work.work': { $ne: work } }, {
            $push: {
                regular_work: Obj
            }
        })

        if (doWork.modifiedCount <= 0) {
            return res.status(400).json(errorResponse('Already completed'))
        }

        res.status(201).json(successResponse('Work completed', Obj))

    } catch (error) {
        next(error)
    }
}

const doExtraWork = async (req, res, next) => {
    try {
        const { work, punch_id } = req.body

        if (!work || !punch_id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const todayWork = await StaffWorksModel.findById(punch_id).select({ break: { $slice: -1 } })
        if (!todayWork?.punch_in || (todayWork?.punch_out && !todayWork?.over_time?.in) || todayWork?.over_time?.out) {
            return res.status(409).json(errorResponse('Cannot check the work, Try now !', 409))
        }

        const Obj = {
            work,
            start: new Date(),
            end: new Date(),
            duration: 0
        }

        const doWork = await StaffWorksModel.updateOne({ _id: new ObjectId(punch_id), 'extra_work.work': { $ne: work } }, {
            $push: {
                extra_work: Obj
            }
        })

        if (doWork.modifiedCount <= 0) {
            return res.status(400).json(errorResponse('Already completed'))
        }

        res.status(201).json(successResponse('Extra work added', Obj))

    } catch (error) {
        next(error)
    }
}

const getWorksData = async (req, res, next) => {
    try {
        let { from_date, to_date } = req.query

        if (!from_date || !to_date) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const allWorks = await StaffWorksModel.aggregate([
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
                    full_name: {
                        $concat: [
                            { $arrayElemAt: ['$staff.first_name', 0] },
                            ' ',
                            { $arrayElemAt: ['$staff.last_name', 0] }
                        ]
                    },
                    designation: { $arrayElemAt: ['$designation.designation', 0] },
                    name: 1, date: 1, auto_punch_out: 1,
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
                    over_time: {
                        in: {
                            $dateToString: {
                                format: "%H:%M:%S",
                                date: {
                                    $add: [
                                        "$over_time.in",
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
                        out: {
                            $dateToString: {
                                format: "%H:%M:%S",
                                date: {
                                    $add: [
                                        "$over_time.out",
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
                                    { $subtract: ["$over_time.out", "$over_time.in"] },
                                    1000
                                ]
                            }
                        },
                        auto: '$over_time.auto'
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
                    lunch_break: {
                        start: {
                            $dateToString: {
                                format: "%H:%M:%S",
                                date: {
                                    $add: [
                                        "$lunch_break.start",
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
                                        "$lunch_break.end",
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
                        duration: "$lunch_break.duration"
                    },
                }
            },
            {
                $group: {
                    _id: {
                        name: "$name",
                        staff_name: "$staff_name",
                        full_name: "$full_name",
                        designation: "$designation",
                    },
                    dates: {
                        $push: {
                            date: "$date",
                            punch_in: '$punch_in', punch_out: '$punch_out',
                            duration: '$duration',
                            regular_work: "$regular_work",
                            extra_work: "$extra_work",
                            break: '$break',
                            lunch_break: '$lunch_break',
                            over_time: '$over_time',
                            auto_punch_out: '$auto_punch_out'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: "$_id._id",
                    name: "$_id.name",
                    staff_name: "$_id.staff_name",
                    full_name: "$_id.full_name",
                    designation: "$_id.designation",
                    dates: 1
                }
            }
        ])

        if (!allWorks) {
            return res.status(400).json(errorResponse('No matched data'))
        }

        res.status(201).json(successResponse('All works data', allWorks))

    } catch (error) {
        next(error)
    }
}

const analyzeWorkData = async (req, res, next) => {
    try {
        const { from_date, to_date, staff_id, type } = req.query
        if (!from_date || !to_date || !type) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }
        // Match Stage
        const matchStage = {
            date: {
                $gte: from_date,
                $lte: to_date
            }
        };
        if (staff_id) {
            matchStage.name = new ObjectId(staff_id);
        }

        // Group Stage 01
        let groupStage = {}
        if (type === 'date-basie') {
            groupStage = {
                _id: {
                    date: "$date",

                },
                staff: {
                    $push: {
                        staff_id: "$staff_id",
                        full_name: "$full_name",
                        designation: "$designation",
                        punch: '$punch',
                        over_time: '$over_time',
                        regular_work: "$regular_work",
                        extra_work: "$extra_work",
                        break: '$break',
                        lunch_break: '$lunch_break',
                        break_duration: '$break_duration',
                        auto_punch_out: '$auto_punch_out'
                    }
                }
            }
        } else {
            groupStage = {
                _id: {
                    staff_id: "$staff_id",
                    full_name: "$full_name",
                    designation: "$designation",
                },
                dates: {
                    $push: {
                        date: "$date",
                        punch: '$punch',
                        over_time: '$over_time',
                        regular_work: "$regular_work",
                        extra_work: "$extra_work",
                        break: '$break',
                        lunch_break: '$lunch_break',
                        break_duration: '$break_duration',
                        auto_punch_out: '$auto_punch_out'
                    }
                }
            }
        }

        // Sort Stage
        let sortStageOne = {}
        if (type === 'date-basie') {
            sortStageOne = {
                full_name: 1
            }
        } else {
            sortStageOne = {
                date: 1
            }
        }
        // Sort Stage
        let sortStageTwo = {}
        if (type === 'date-basie') {
            sortStageTwo = {
                date: 1,
            }
        } else {
            sortStageTwo = {
                full_name: 1
            }
        }

        // Project Stage 02
        let projectStage = {}
        if (type === 'date-basie') {
            projectStage = {
                _id: 0,
                date: "$_id.date",
                staff: 1
            }
        } else {
            projectStage = {
                _id: 0,
                staff_id: "$_id.staff_id",
                full_name: "$_id.full_name",
                designation: "$_id.designation",
                dates: 1
            }
        }



        const workAnalyze = await StaffWorksModel.aggregate([
            // Match Stage
            {
                $match: matchStage
            },
            // Lookup Stage 02
            {
                $lookup: {
                    from: 'staff_datas',
                    localField: 'name',
                    foreignField: '_id',
                    as: 'staff'
                }
            },
            // Project Stage 01
            {
                $project: {
                    full_name: {
                        $concat: [
                            { $arrayElemAt: ['$staff.first_name', 0] },
                            ' ',
                            { $arrayElemAt: ['$staff.last_name', 0] }
                        ]
                    },
                    staff_id: '$name',
                    date: 1, auto_punch_out: 1, designation: 1,
                    punch: {
                        in: {
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
                        out: {
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
                    },
                    over_time: {
                        in: {
                            $dateToString: {
                                format: "%H:%M:%S",
                                date: {
                                    $add: [
                                        "$over_time.in",
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
                        out: {
                            $dateToString: {
                                format: "%H:%M:%S",
                                date: {
                                    $add: [
                                        "$over_time.out",
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
                                    { $subtract: ["$over_time.out", "$over_time.in"] },
                                    1000
                                ]
                            }
                        },
                        auto: '$over_time.auto'
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
                    lunch_break: {
                        start: {
                            $dateToString: {
                                format: "%H:%M:%S",
                                date: {
                                    $add: [
                                        "$lunch_break.start",
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
                                        "$lunch_break.end",
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
                        duration: "$lunch_break.duration"
                    },
                    break_duration: {
                        $add: [
                            { $ifNull: ["$lunch_break.duration", 0] },
                            {
                                $sum: "$break.duration"
                            }
                        ]
                    }
                }
            },
            // Sort Stage 01
            {
                $sort: sortStageOne
            },
            // Group Stage 01
            {
                $group: groupStage
            },
            // Project Stage 02
            {
                $project: projectStage
            },
            // Sort Stage  02
            {
                $sort: sortStageTwo
            },

        ])

        res.status(201).json(successResponse('Analyzed data', workAnalyze))

    } catch (error) {
        next(error)
    }
}

// * Launch Break
const doStartLunchBreak = async (req, res, next) => {
    try {
        let { id } = req.body

        if (!id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const todayWork = await StaffWorksModel.findById(id).select({ break: { $slice: -1 } })

        if (!(todayWork?.punch_in && !todayWork?.punch_out || todayWork?.over_time?.in && !todayWork?.over_time?.out)) {
            return res.status(400).json(errorResponse('Cannot start the break, Try now !'))
        }

        if (todayWork?.break?.[0]?.start && !todayWork?.break?.[0]?.end) {
            return res.status(400).json(errorResponse('You are already on break'))
        }

        if (todayWork.lunch_break?.start) {
            return res.status(400).json(errorResponse('You are already on lunch break'))
        }

        const lunchBreak = {
            start: new Date(),
            end: null,
            duration: 0
        }

        await StaffWorksModel.findByIdAndUpdate(id, {
            $set: {
                lunch_break: lunchBreak
            }
        })

        res.status(201).json(successResponse('Break started', lunchBreak))

    } catch (error) {
        next(error)
    }
}

const doEndLunchBreak = async (req, res, next) => {
    try {
        let { id } = req.body

        if (!id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const todayWork = await StaffWorksModel.findById(id)

        if (!(todayWork?.punch_in && !todayWork?.punch_out || todayWork?.over_time?.in && !todayWork?.over_time?.out)) {
            return res.status(400).json(errorResponse('Cannot start the break, Try now !'))
        }

        if (!todayWork?.lunch_break?.start || todayWork?.lunch_break?.end) {
            return res.status(400).json(errorResponse('You are not start any lunch break'))
        }

        const lunchBreak = {
            start: todayWork?.lunch_break?.start,
            end: new Date(),
            duration: parseInt((new Date() - todayWork?.lunch_break?.start) / 1000)
        }

        await StaffWorksModel.findByIdAndUpdate(id, {
            $set: {
                lunch_break: lunchBreak
            }
        })

        res.status(201).json(successResponse('Break ended', lunchBreak))

    } catch (error) {
        next(error)
    }
}

//* Offline
const doOfflineRecollection = async (req, res, next) => {
    try {

        let { _id, offBreak, extra_work, regular_work, lunch_break } = req.body
        let workData = await StaffWorksModel.findOne({ _id: new ObjectId(_id) })

        if (workData.punch_out && !workData?.over_time?.in) {
            return res.status(409).json(errorResponse('You are punch outed, Must start Over time for Offline recollection', 409,
                { punch_out: workData.punch_out }))
        }

        let alreadyExist = false

        // Check if already added
        if (regular_work?.[0]) {
            alreadyExist = workData.regular_work.filter((obj) => obj.work == regular_work[0].work)?.[0] ? true : false
        } else if (extra_work?.[0]) {
            alreadyExist = workData.extra_work.filter((obj) => obj.work == extra_work[0].work)?.[0] ? true : false
        } else if (offBreak?.[0]) {
            alreadyExist = workData.break.filter((obj) => {
                return obj.start.toISOString() == offBreak[0].start &&
                    (obj?.end?.toISOString() || null) == offBreak[0].end
            })?.[0] ? true : false
        } else if (lunch_break) {
            alreadyExist = workData?.lunch_break?.duration === lunch_break?.duration ? true : false
        }

        if (alreadyExist) {
            return res.status(429).json(errorResponse('Already Updated', 429))
        }

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
        if (offBreak?.[0] || extra_work?.[0] || regular_work?.[0] || lunch_break) {
            await StaffWorksModel.findByIdAndUpdate(_id, {
                $push: {
                    break: { $each: offBreak },
                    extra_work: { $each: extra_work },
                    regular_work: { $each: regular_work }
                },
                $set: {
                    lunch_break
                }
            })
        }

        let lastBreak = workData?.break.slice(-1)[0] || null
        await StaffWorksModel.findById(_id).then((result) => {
            lastBreak = result?.break.slice(-1)[0]
        })

        res.status(201).json(successResponse('All data uploaded', lastBreak))

    } catch (error) {
        next(error)
    }
}


module.exports = {
    getLatestPunchDetails, doPunchIn, doPunchOut, doStartBreak, doEndBreak, doRegularWork, doExtraWork, getWorksData,
    doOfflineRecollection, doStartLunchBreak, doEndLunchBreak, doAutoPunchOut, doStartOverTime, doStopOverTime,
    doAutoOverTimeOut, analyzeWorkData
}