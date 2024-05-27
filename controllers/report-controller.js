const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const QrGenModel = require('../models/qr-generator-list')
const StaffModel = require('../models/staff-model')
const StaffWorksModel = require('../models/staff_works_model')
const DesignationModel = require('../models/designation_models');
const LeaveAppModel = require('../models/leave-letter-model')
const { successResponse, errorResponse } = require('../helpers/response-helper')
const { YYYYMMDDFormat, Date } = require('../helpers/dateUtils');
const { generateMonthlyWorkReport } = require('./staff-work-controller');


const summeryReport = async (req, res, next) => {
    try {
        const allStaff = await StaffModel.find().count()
        const activeStaff = await StaffModel.find({ delete: { $ne: true } }).count()
        const designations = await DesignationModel.find({ delete: { $ne: true } }).count()
        const pendingLeaves = await LeaveAppModel.find({ leave_status: 'Pending' }).count()
        const activeQr = await QrGenModel.find({
            $nor: [
                { delete: { $lte: new Date(new Date().setDate(new Date().getDate())) } },
                { expire_date: { $lte: YYYYMMDDFormat(new Date(new Date().setDate(new Date().getDate()))) } }
            ]
        }).count()

        const report = {
            staff_count: allStaff,
            active_staff_count: activeStaff,
            designation_count: designations,
            pending_l2: pendingLeaves,
            active_qr_count: activeQr
        }

        res.status(201).json(successResponse('Summery Report', report))


    } catch (error) {
        next(error)
    }
}

const staffCurrentStatus = async (req, res, next) => {
    try {
        const { last_action } = req.query

        const formattedDate = YYYYMMDDFormat(new Date());

        if (last_action) {
            const todayLastAction = await StaffWorksModel.aggregate([
                {
                    $match: {
                        date: formattedDate
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
                    $project: {
                        punch_list: 1,
                        name: 1,
                        updatedAt: 1,
                        designation: 1,
                        first_name: { $arrayElemAt: ['$staff.first_name', 0] },
                        last_name: { $arrayElemAt: ['$staff.last_name', 0] },
                    }
                },
                {
                    $sort: {
                        updatedAt: -1
                    }
                },
            ]).limit(Number(last_action || 0))

            todayLastAction.forEach((work) => {
                if (work.punch_list[work.punch_list.length - 1].in
                    && !work.punch_list[work.punch_list.length - 1].out) {
                    work.status = "IN"
                    work.punch_list = null
                } else {
                    work.status = "OUT"
                    work.punch_list = null
                }
            })

            res.status(201).json(successResponse('Last work actions', todayLastAction))

        } else {
            const activeStaff = await StaffModel.find({ delete: { $ne: true } }, { first_name: 1, last_name: 1 }).populate('designation', 'designation')
                .sort({ _id: 1 })

            const todayWork = await StaffWorksModel.aggregate([
                {
                    $match: {
                        date: formattedDate
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
                    $project: {
                        punch_list: 1,
                        name: 1,
                        updatedAt: 1,
                        designation: 1,
                        first_name: { $arrayElemAt: ['$staff.first_name', 0] },
                        last_name: { $arrayElemAt: ['$staff.last_name', 0] },
                    }
                },
                {
                    $sort: {
                        name: 1
                    }
                },
            ])


            let k = 0
            let staffArray = []

            for (let i = 0; i < activeStaff.length; i++) {
                if (activeStaff[i]._id.toString() == todayWork[k]?.name.toString()) {
                    // If Punched
                    if (todayWork[k].punch_list[todayWork[k].punch_list.length - 1].in
                        && !todayWork[k].punch_list[todayWork[k].punch_list.length - 1].out) {
                        todayWork[k].status = "IN"
                        todayWork[k].punch_list = null
                    } else {
                        todayWork[k].status = "OUT"
                        todayWork[k].punch_list = null
                    }
                    staffArray.push(todayWork[k])

                    k++
                } else {
                    // If not Punched
                    const obj = {
                        "_id": null,
                        "name": activeStaff[i]._id,
                        "designation": activeStaff[i].designation?.designation,
                        "punch_list": [],
                        "updatedAt": null,
                        "first_name": activeStaff[i].first_name,
                        "last_name": activeStaff[i].last_name,
                        'status': 'PENDING'
                    }
                    staffArray.push(obj)
                }
            }

            res.status(201).json(successResponse('All Staff work actions', staffArray))
        }


    } catch (error) {
        next(error)
    }
}

const bestFiveStaff = async (req, res, next) => {
    try {
        let thisMonthReport = await generateMonthlyWorkReport(true)
        thisMonthReport.sort((a, b) => (b.worked_time + b.extra_time) - (a.worked_time + a.extra_time));
        thisMonthReport = thisMonthReport.slice[0, 5]
        res.status(201).json(successResponse('Best Five Staff', thisMonthReport))
    } catch (error) {
        next(error)
    }
}

// Attendance Report   ---- Start

function generateMatchStage(type, duration) {
    const currentDate = new Date();
    let dateFilter = {};

    switch (type) {
        case 'Days':
            dateFilter = { $gt: YYYYMMDDFormat(new Date(currentDate.setDate(currentDate.getDate() - duration))) };
            break;
        case 'Weeks':
            dateFilter = { $gt: YYYYMMDDFormat(new Date(currentDate.setDate(currentDate.getDate() - (duration * 7)))) };
            break;
        case 'Months':
            dateFilter = { $gt: YYYYMMDDFormat(new Date(currentDate.setMonth(currentDate.getMonth() - (duration - 1)))) };
            break;
        case 'Years':
            dateFilter = { $gt: YYYYMMDDFormat(new Date(currentDate.setFullYear(currentDate.getFullYear() - duration))) };
            break;
        default:
            throw new Error('Invalid time type');
    }
    return { date: dateFilter };
}

function generateProjectStage(type) {
    return {
        name: 1,
        groupId: getGroupIdProjection(type),
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
    };
}

function getGroupIdProjection(type) {
    switch (type) {
        case 'Days':
            return '$date';
        case 'Weeks':
            return { $isoWeek: { $dateFromString: { dateString: "$date", format: "%Y-%m-%d" } } };
        case 'Months':
            return { $substr: ["$date", 0, 7] };
        case 'Years':
            return { $substr: ["$date", 0, 4] };
        default:
            throw new Error('Invalid time type');
    }
}

function getTimePeriodChart(type, duration) {
    let dateArray = []

    switch (type) {
        case 'Days':
            for (let i = duration - 1; i >= 0; i--) {
                dateArray.push(YYYYMMDDFormat(new Date(new Date().setDate(new Date().getDate() - i))))
            }
            return dateArray
        case 'Weeks':
            for (let i = duration - 1; i >= 0; i--) {
                dateArray.push(new Date(new Date().setDate(new Date().getDate() - (i * 7))).getWeek())
            }
            return dateArray
        case 'Months':
            for (let i = duration - 1; i >= 0; i--) {
                dateArray.push(YYYYMMDDFormat(new Date(new Date().setMonth(new Date().getMonth() - i))).slice(0, 7))
            }
            return dateArray
        case 'Years':
            for (let i = duration - 1; i >= 0; i--) {
                dateArray.push(YYYYMMDDFormat(new Date(new Date().setFullYear(new Date().getFullYear() - i))).slice(0, 4))
            }
            return dateArray
        default:
            throw new Error('Invalid time type');
    }
}

const attendanceReport = async (req, res, next) => {

    try {

        // Type : Days, Weeks, Months, Years
        const { type } = req.query
        const duration = 10

        const timeArray = getTimePeriodChart(type, duration)

        const findReport = await StaffWorksModel.aggregate([
            {
                $match: generateMatchStage(type, duration)
            },
            {
                $project: generateProjectStage(type)
            },
            {
                $group: {
                    _id: '$groupId',
                    punch_duration: { $sum: '$punch_duration' },
                    total_staff: { $sum: 1 }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ])

        for (let i = 0; i < timeArray.length; i++) {

            if (findReport[i]?._id != timeArray[i]) {
                const obj = {
                    _id: timeArray[i],
                    punch_duration: 0,
                    total_staff: 0
                }
                findReport.splice(i, 0, obj)
            }
        }

        res.status(201).json(successResponse('Report', findReport))

    } catch (error) {
        next(error)
    }

}

module.exports = {
    summeryReport, staffCurrentStatus, bestFiveStaff, attendanceReport
}