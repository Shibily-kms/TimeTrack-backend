const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const StaffWorksModel = require('../models/staff_works_model')
const MonthlyReportModel = require('../models/monthly_report')
const StaffModel = require('../models/staff-model')
const QrGenModel = require('../models/qr-generator-list')
const { YYYYMMDDFormat } = require('../helpers/dateUtils')
const { successResponse, errorResponse } = require('../helpers/response-helper')


const getLatestPunchDetails = async (req, res, next) => {
    try {
        const formattedDate = YYYYMMDDFormat(new Date());
        let todayDetails = await StaffWorksModel.findOne({ name: new ObjectId(req.user.acc_id), date: formattedDate }, { regular_work: 0 })
        if (!todayDetails) {
            return res.status(201).json(successResponse('No today details', {}))
        }

        res.status(201).json(successResponse('Today work data', todayDetails))

    } catch (error) {
        next(error)
    }
}

const getAnalyzeWorkDataForCalendar = async (req, res, next) => {
    try {
        const { staff_id, from_date, to_date } = req.query

        if (!staff_id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const fullData = await StaffWorksModel.find({ name: new ObjectId(staff_id) }, { date: 1 })

        res.status(201).json(successResponse('Work data for calendar', fullData))

    } catch (error) {
        next(error)
    }
}

const doAutoPunchOut = (staffId) => {
    return new Promise(async (resolve, reject) => {

        try {
            const date = YYYYMMDDFormat(new Date())
            await StaffWorksModel.updateMany({ name: new ObjectId(staffId), date, 'punch_list.out': null }, {
                $set: {
                    'punch_list.$.out': new Date(),
                    'punch_list.$.out_by': 'Auto',
                    'punch_list.$.auto': true
                }
            })

            resolve()

        } catch (error) {
            reject(error)
        }
    })
}

const doExtraWork = async (req, res, next) => {
    try {
        const { work, punch_id } = req.body
        const userId = req.user.acc_id

        if (!work || !punch_id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        // Get Today Work Data and validate for IN
        const formattedDate = YYYYMMDDFormat(new Date());
        const todayWorkData = await StaffWorksModel.findOne({ name: new ObjectId(userId), date: formattedDate })

        const lastEntry = todayWorkData?.punch_list?.[todayWorkData?.punch_list?.length - 1] || {}

        if (!lastEntry?.in || (lastEntry?.in && lastEntry?.out)) {
            return res.status(400).json(errorResponse('You have not Enter to work', 400))
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
                        regular_work: "$regular_work",
                        extra_work: "$extra_work",
                        punch_list: '$punch_list',
                        total_working_time: '$total_working_time'
                    }
                }
            }
        } else {
            groupStage = {
                _id: {
                    staff_id: "$staff_id",
                    full_name: "$full_name",
                },
                dates: {
                    $push: {
                        date: "$date",
                        designation: "$designation",
                        regular_work: "$regular_work",
                        extra_work: "$extra_work",
                        current_salary: '$current_salary',
                        current_working_days: '$current_working_days',
                        current_working_time: '$current_working_time',
                        punch_list: '$punch_list',
                        total_working_time: '$total_working_time'
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
                    current_salary: '$current_salary',
                    current_working_days: '$current_working_days',
                    current_working_time: '$current_working_time',
                    date: 1, designation: 1,
                    punch_list: {
                        $map: {
                            input: "$punch_list",
                            as: "punch",
                            in: {
                                $mergeObjects: [
                                    "$$punch",
                                    {
                                        in: {
                                            $dateToString: {
                                                format: "%H:%M:%S",
                                                date: {
                                                    $add: [
                                                        "$$punch.in",
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
                                                        "$$punch.out",
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
                                                    { $subtract: ["$$punch.out", "$$punch.in"] },
                                                    1000
                                                ]
                                            }
                                        },
                                    }
                                ]
                            }
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
                    }
                }
            },
            // Project 1B
            {
                $project: {
                    full_name: 1,
                    staff_id: 1,
                    current_salary: 1,
                    current_working_days: 1,
                    current_working_time: 1,
                    date: 1, designation: 1,
                    punch_list: 1, regular_work: 1,
                    extra_work: 1,
                    total_working_time: {
                        $sum: "$punch_list.duration"
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

const generateMonthlyWorkReportSingleStaff = async (staff_id, this_month) => {
    /*
        This Function used for Two things
        
        1. Generate Previous month salary Report (This not pass this_month argument) 
           This Generate and Save the report to Salary Report DB.
        2. Temp Generate This month salary Report (This pass this_month argument)
           This not save to DB, Only pass generated data to client side
    */

    const currentDate = new Date();
    let firstDayOfMonth = null
    let lastDayOfMonth = null

    // This Month Or Previous month
    if (this_month) {
        firstDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
        lastDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0))
    } else {
        firstDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
        lastDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 0))
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let reportData = await StaffWorksModel.aggregate([
        {
            $match: {
                date: {
                    $gte: firstDayOfMonth,
                    $lte: lastDayOfMonth
                },
                name: new ObjectId(staff_id)
            }
        },
        {
            $project: {
                name: 1,
                date: {
                    $substr: ["$date", 0, 7]
                },
                punch_duration: {
                    $sum: {
                        $map: {
                            input: "$punch_list",
                            as: "punch",
                            in: {
                                $round: {
                                    $divide: [
                                        { $subtract: ["$$punch.out", "$$punch.in"] },
                                        1000
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: {
                    staffId: '$name',
                    date: '$date'
                },
                worked_time: {
                    $sum: '$punch_duration'
                },
                worked_days: {
                    $sum: 1
                }
            }
        },
        {
            $lookup: {
                from: 'staff_datas',
                localField: '_id.staffId',
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
                // total_break: 1, 
                worked_days: 1, _id: 0, worked_time: 1,
                staffId: '$_id.staffId',
                date: '$_id.date',
                full_name: {
                    $concat: [
                        { $arrayElemAt: ['$staff.first_name', 0] },
                        ' ',
                        { $arrayElemAt: ['$staff.last_name', 0] }
                    ]
                },
                designation: { $arrayElemAt: ['$designation.designation', 0] },
                monthly_salary: {
                    $ifNull: [
                        { $arrayElemAt: ['$staff.current_salary', 0] },
                        0
                    ]
                },
                working_days: {
                    $ifNull: [
                        { $arrayElemAt: ['$staff.current_working_days', 0] },
                        0
                    ]
                },
                day_hours: {
                    $ifNull: [
                        { $arrayElemAt: ['$staff.current_working_time', 0] },
                        0
                    ]
                },
                balance_CF: {
                    $ifNull: [
                        { $arrayElemAt: ['$staff.balance_CF', 0] },
                        0
                    ]
                }
            }
        },
        {
            $sort: {
                full_name: 1
            }
        }
    ])

    for (let i = 0; i < reportData.length; i++) {

        if ((reportData[i].day_hours * reportData[i].working_days) < reportData[i].worked_time) {
            // if More
            reportData[i].allowed_salary = reportData[i].monthly_salary
            reportData[i].used_CF = 0
            reportData[i].extra_time = parseInt(reportData[i].worked_time - (reportData[i].day_hours * reportData[i].working_days))
            reportData[i].worked_time = reportData[i].day_hours * reportData[i].working_days
        } else {
            // if Less
            reportData[i].extra_time = 0
            let hourSalary = parseFloat((reportData[i].monthly_salary / ((reportData[i].working_days * reportData[i].day_hours) / 3600)).toFixed(2))
            reportData[i].allowed_salary = 0
            if (this_month) {
                reportData[i].allowed_salary = parseInt(hourSalary * (reportData[i].worked_time / 3600))
            } else {
                reportData[i].used_CF = Math.min(parseInt((reportData[i].day_hours * reportData[i].working_days) - reportData[i].worked_time), reportData[i].balance_CF);
                let workedHour = (reportData[i].worked_time + reportData[i].used_CF) / 3600
                reportData[i].allowed_salary = (reportData[i].worked_time + reportData[i].used_CF) >= (reportData[i].day_hours * reportData[i].working_days)
                    ? reportData[i].monthly_salary : parseInt(hourSalary * workedHour)
            }

        }

        if (!this_month) {

            await StaffModel.updateOne({ _id: new ObjectId(reportData[i].staffId) }, {
                $inc: {
                    balance_CF: reportData[i].extra_time - reportData[i].used_CF
                }
            })
        }
    }

    if (!this_month) {
        await MonthlyReportModel.create(reportData)
    }

    return reportData;

}

const generateMonthlyWorkReport = async (this_month) => {
    /*
        This Function used for Two things
        
        1. Generate Previous month salary Report (This not pass this_month argument) 
           This Generate and Save the report to Salary Report DB.
        2. Temp Generate This month salary Report (This pass this_month argument)
           This not save to DB, Only pass generated data to client side
    */

    const currentDate = new Date();
    let firstDayOfMonth = null
    let lastDayOfMonth = null

    // This Month Or Previous month
    if (this_month) {
        firstDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
        lastDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0))
    } else {
        firstDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
        lastDayOfMonth = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 0))
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let reportData = await StaffWorksModel.aggregate([
        {
            $match: {
                date: {
                    $gte: firstDayOfMonth,
                    $lte: lastDayOfMonth
                }
            }
        },
        {
            $project: {
                name: 1,
                date: {
                    $substr: ["$date", 0, 7]
                },
                punch_duration: {
                    $sum: {
                        $map: {
                            input: "$punch_list",
                            as: "punch",
                            in: {
                                $round: {
                                    $divide: [
                                        { $subtract: ["$$punch.out", "$$punch.in"] },
                                        1000
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: {
                    staffId: '$name',
                    date: '$date'
                },
                worked_time: {
                    $sum: '$punch_duration'
                },
                worked_days: {
                    $sum: 1
                }
            }
        },
        {
            $lookup: {
                from: 'staff_datas',
                localField: '_id.staffId',
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
                // total_break: 1, 
                worked_days: 1, _id: 0, worked_time: 1,
                staffId: '$_id.staffId',
                date: '$_id.date',
                full_name: {
                    $concat: [
                        { $arrayElemAt: ['$staff.first_name', 0] },
                        ' ',
                        { $arrayElemAt: ['$staff.last_name', 0] }
                    ]
                },
                designation: { $arrayElemAt: ['$designation.designation', 0] },
                monthly_salary: {
                    $ifNull: [
                        { $arrayElemAt: ['$staff.current_salary', 0] },
                        0
                    ]
                },
                working_days: {
                    $ifNull: [
                        { $arrayElemAt: ['$staff.current_working_days', 0] },
                        0
                    ]
                },
                day_hours: {
                    $ifNull: [
                        { $arrayElemAt: ['$staff.current_working_time', 0] },
                        0
                    ]
                },
                balance_CF: {
                    $ifNull: [
                        { $arrayElemAt: ['$staff.balance_CF', 0] },
                        0
                    ]
                }
            }
        },
        {
            $sort: {
                full_name: 1
            }
        }
    ])

    for (let i = 0; i < reportData.length; i++) {

        if ((reportData[i].day_hours * reportData[i].working_days) < reportData[i].worked_time) {
            // if More
            reportData[i].allowed_salary = reportData[i].monthly_salary
            reportData[i].used_CF = 0
            reportData[i].extra_time = parseInt(reportData[i].worked_time - (reportData[i].day_hours * reportData[i].working_days))
            reportData[i].worked_time = reportData[i].day_hours * reportData[i].working_days
        } else {
            // if Less
            reportData[i].extra_time = 0
            let hourSalary = parseFloat((reportData[i].monthly_salary / ((reportData[i].working_days * reportData[i].day_hours) / 3600)).toFixed(2))
            reportData[i].allowed_salary = 0
            if (this_month) {
                reportData[i].allowed_salary = parseInt(hourSalary * (reportData[i].worked_time / 3600))
            } else {
                reportData[i].used_CF = Math.min(parseInt((reportData[i].day_hours * reportData[i].working_days) - reportData[i].worked_time), reportData[i].balance_CF);
                let workedHour = (reportData[i].worked_time + reportData[i].used_CF) / 3600
                reportData[i].allowed_salary = (reportData[i].worked_time + reportData[i].used_CF) >= (reportData[i].day_hours * reportData[i].working_days)
                    ? reportData[i].monthly_salary : parseInt(hourSalary * workedHour)
            }

        }

        if (!this_month) {

            await StaffModel.updateOne({ _id: new ObjectId(reportData[i].staffId) }, {
                $inc: {
                    balance_CF: reportData[i].extra_time - reportData[i].used_CF
                }
            })
        }
    }

    if (!this_month) {
        await MonthlyReportModel.create(reportData)
    }

    return reportData;

}

const monthlyWorkReport = async (req, res) => {
    try {

        const { date, generate_last_month } = req.query

        const thisMonth = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`
        let reportData = []

        if (date === thisMonth) {
            reportData = await generateMonthlyWorkReport(date)
        } else if (date) {
            reportData = await MonthlyReportModel.aggregate([
                {
                    $match: { date }
                },
                {
                    $lookup: {
                        from: 'staff_datas',
                        localField: 'staffId',
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
                        full_name: {
                            $concat: [
                                { $arrayElemAt: ['$staff.first_name', 0] },
                                ' ',
                                { $arrayElemAt: ['$staff.last_name', 0] }
                            ]
                        },
                        designation: { $arrayElemAt: ['$designation.designation', 0] },
                        date: 1,
                        staffId: 1,
                        working_days: 1,
                        worked_days: 1,
                        day_hours: 1,
                        worked_time: 1,
                        extra_time: 1,
                        monthly_salary: 1,
                        allowed_salary: 1,
                        total_break: 1,
                        used_CF: 1,
                        allowance: 1,
                        incentive: 1,
                        for_round_amount: 1
                    }
                },
                {
                    $sort: {
                        full_name: 1
                    }
                }
            ])
        } else if (generate_last_month === 'TRUE') {
            reportData = await generateMonthlyWorkReport()
        }

        res.status(201).json(successResponse('Report generated', reportData))

    } catch (error) {
        res.status(400).json(errorResponse('Report generate field'))
    }
}

const getSingleSalaryReport = async (req, res, next) => {
    try {
        const { month, staff_id } = req.query
        const thisMonth = `${new Date().getFullYear()}-${("0" + (new Date(new Date()).getMonth() + 1)).slice(-2)}`

        if (!month || !staff_id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }
        let report = null

        if (thisMonth === month) {
            report = await generateMonthlyWorkReportSingleStaff(staff_id, true)
            report = report[0]
        } else {
            report = await MonthlyReportModel.findOne({ date: month, staffId: new ObjectId(staff_id) })
        }

        if (!report) {
            return res.status(404).json(errorResponse('Report not available', 404))
        }

        res.status(201).json(successResponse('Report', report, 201))

    } catch (error) {
        next(error)
    }
}

const updateMonthlyWorkReport = async (req, res, next) => {
    try {
        const { _id } = req.body
        if (!_id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const updateData = await MonthlyReportModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                for_round_amount: req.body?.for_round_amount || undefined,
                allowance: req.body?.allowance || [],
                incentive: req.body?.incentive || [],
            }
        })

        if (updateData?.modifiedCount < 0) {
            return res.status(404).json(errorResponse('Invalid report Id', 404))
        }

        res.status(201).json(successResponse('Updated', 201))
    } catch (error) {
        next(error)
    }
}

const changeWorkTime = async (req, res, next) => {
    // try {
    //     let { punch_in, punch_out, date, staff_id } = req.body

    //     if (!punch_in || !date || !staff_id) {
    //         return res.status(409).json(errorResponse('Request body is missing', 409))
    //     }

    //     punch_in = new Date(`${date} ${punch_in}`)
    //     punch_out = punch_out ? new Date(`${date} ${punch_out}`) : null

    //     await StaffWorksModel.updateOne({ name: new ObjectId(staff_id), date }, {
    //         $set: {
    //             punch_in,
    //             punch_out,
    //             last_edit_time: new Date()
    //         }
    //     })
    //     res.status(201).json(successResponse('Updated'))
    // } catch (error) {
    //     next(error)
    // }
}

//* Offline
const doOfflineRecollection = async (req, res, next) => {
    try {

        let { punch_id, regular_work, extra_work, updated_date } = req.body

        if (!punch_id) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        let workData = await StaffWorksModel.findOne({ _id: new ObjectId(punch_id) })

        if (updated_date === workData.updatedAt) {
            return res.status(429).json(errorResponse('Already Sync', 429))
        }

        regular_work = regular_work?.map((item) => ({
            "work": item.title,
            "start": item.do_time,
            "end": item.do_time,
            "duration": 0,
        }))

        if (extra_work?.[0] || regular_work?.[0]) {
            await StaffWorksModel.findByIdAndUpdate(punch_id, {
                $push: {
                    extra_work: { $each: extra_work },
                    regular_work: { $each: regular_work }
                }
            })
        }


        const latestWork = await StaffWorksModel.findById(punch_id, { regular_work: 0 })

        res.status(201).json(successResponse('All data uploaded', latestWork))

    } catch (error) {
        next(error)
    }
}


//* In And Out   ----------- Start

const inToWork = async (req, res, next) => {
    try {
        const { do_type, designation } = req.body
        const userId = req.user.acc_id
       
        // Initial Validation
        if (!do_type || !designation) {
            return res.status(409).json(errorResponse('Must pass a "IN" time', 409))
        }

        // Get Staff data and validate staff
        const staffData = await StaffModel.findOne({ _id: new ObjectId(userId) })

        if (!staffData || staffData?.delete) {
            return res.status(409).json(errorResponse('Invalid Staff Id ', 409))
        }

        // Get Today Work Data and validate for IN
        const formattedDate = YYYYMMDDFormat(new Date());
        const todayWorkData = await StaffWorksModel.findOne({ name: new ObjectId(userId), date: formattedDate })

        const lastEntry = todayWorkData?.punch_list?.[todayWorkData?.punch_list?.length - 1] || {}

        if (lastEntry?.in && !lastEntry?.out) {
            return res.status(400).json(errorResponse('You have already in a work', 400))
        }

        // If First In then Create New Work
        const inData = {
            name: new ObjectId(userId),
            date: formattedDate,
            designation,
            punch_list: [
                {
                    in: new Date(),
                    out: null,
                    in_by: do_type,
                    out_by: null,
                }
            ]
        }

        if (!lastEntry?.in) {
            const response = await StaffWorksModel.create(inData)

            if (!response) {
                return res.status(400).json(errorResponse('Try again !'))
            }

            res.status(201).json(successResponse('Work IN Success', response))
        }

        if (lastEntry?.in) {
            await StaffWorksModel.updateMany({ name: new ObjectId(userId), date: formattedDate }, {
                $push: {
                    punch_list: {
                        in: new Date(),
                        out: null,
                        in_by: do_type,
                        out_by: null,
                    }
                }
            })

            res.status(201).json(successResponse('Work IN Success'))
        }

    } catch (error) {
        next(error)
    }
}

const outFromWork = async (req, res, next) => {
    try {
        const { do_type } = req.body
        const userId = req.user.acc_id

        // Initial Validation
        if (!do_type) {
            return res.status(409).json(errorResponse('Must pass a "OUT" time', 409))
        }

        // Get Staff data and validate staff
        const staffData = await StaffModel.findOne({ _id: new ObjectId(userId) })

        if (!staffData || staffData?.delete) {
            return res.status(409).json(errorResponse('Invalid Staff Id ', 409))
        }

        // Get Today Work Data and validate for IN
        const formattedDate = YYYYMMDDFormat(new Date());
        const todayWorkData = await StaffWorksModel.findOne({ name: new ObjectId(userId), date: formattedDate })

        const lastEntry = todayWorkData?.punch_list?.[todayWorkData?.punch_list?.length - 1] || {}

        if (!lastEntry?.in || (lastEntry?.in && lastEntry?.out)) {
            return res.status(400).json(errorResponse('You have not Enter to work', 400))
        }

        await StaffWorksModel.updateOne({ name: new ObjectId(userId), date: formattedDate, 'punch_list._id': lastEntry._id }, {
            $set: {
                'punch_list.$.out': new Date(),
                'punch_list.$.out_by': do_type
            }
        })

        res.status(201).json(successResponse('Work OUT Success'))


    } catch (error) {
        next(error)
    }
}

const punchWithQrCode = async (req, res, next) => {
    try {
        const { qrId, userId, designation } = req.body

        // Initial Validation
        if (!qrId || !userId) {
            return res.status(409).json(errorResponse('Must pass body content', 409))
        }

        // Check QR Code
        const QrCode = await QrGenModel.findOne({ qrId })

        if (!QrCode || QrCode.delete) {
            return res.status(400).json(errorResponse('Invalid QR Code Id', 400))
        }

        if (YYYYMMDDFormat(new Date()) > QrCode?.expire_date) {
            return res.status(400).json(errorResponse('This QR Code Expired', 400))
        }

        // Update QR Count
        await QrGenModel.updateOne({ qrId }, {
            $inc: { used_count: 1 },
            $set: { last_used: new Date() }
        })


        // Get Staff data and validate staff
        const staffData = await StaffModel.findOne({ _id: new ObjectId(userId) })

        if (!staffData || staffData?.delete) {
            return res.status(409).json(errorResponse('Invalid Staff Id ', 409))
        }

        // Get Today Work Data and validate for IN
        const formattedDate = YYYYMMDDFormat(new Date());
        const todayWorkData = await StaffWorksModel.findOne({ name: new ObjectId(userId), date: formattedDate })

        const lastEntry = todayWorkData?.punch_list?.slice(-1)[0] || {};

        if (lastEntry.in && !lastEntry.out) {
            //* for OUT

            await StaffWorksModel.updateOne({ name: new ObjectId(userId), date: formattedDate, 'punch_list._id': lastEntry._id }, {
                $set: {
                    'punch_list.$.out': new Date(),
                    'punch_list.$.out_by': `QR_${QrCode.name}`
                }
            })

            res.status(201).json(successResponse('Punch out from work'))

        } else if (!lastEntry?.in || lastEntry?.out) {
            //* for IN

            // If First In then Create New Work
            const inData = {
                name: new ObjectId(userId),
                date: formattedDate,
                designation,
                punch_list: [
                    {
                        in: new Date(),
                        out: null,
                        in_by: `QR_${QrCode.name}`,
                        out_by: null,
                    }
                ]
            }

            if (!lastEntry?.in) {
                const response = await StaffWorksModel.create(inData)
                if (!response) {
                    return res.status(400).json(errorResponse('Try again !'))
                }

                res.status(201).json(successResponse('Punch in to work', response))
            }

            if (lastEntry?.in) {
                await StaffWorksModel.updateOne({ name: new ObjectId(userId), date: formattedDate }, {
                    $push: {
                        punch_list: {
                            in: new Date(),
                            out: null,
                            in_by: `QR_${QrCode.name}`,
                            out_by: null,
                        }
                    }
                })

                res.status(201).json(successResponse('Punch in to work'))
            }
        }

    } catch (error) {
        next(error)
    }
}

//! In And OUt   ----------- End



module.exports = {
    getLatestPunchDetails, doExtraWork, doOfflineRecollection, inToWork, outFromWork,
    analyzeWorkData, doAutoPunchOut, generateMonthlyWorkReport, monthlyWorkReport,
    updateMonthlyWorkReport, getSingleSalaryReport, punchWithQrCode, getAnalyzeWorkDataForCalendar,


    changeWorkTime,



}