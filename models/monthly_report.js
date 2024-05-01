const mongoose = require('mongoose');

const monthlyReportSchema = new mongoose.Schema(
    {
        date: String,
        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'staff_datas',
        },
        working_days: Number,
        worked_days: Number,
        day_hours: Number,
        worked_time: Number,
        extra_time: Number,
        monthly_salary: Number,
        allowed_salary: Number,
        total_break: Number,
        used_CF: Number,
        allowance: [],
        incentive: [],
        for_round_amount: Number
    },
    {
        timestamps: true
    })

const MonthlyReportModel = mongoose.model('staff_work_monthly_report', monthlyReportSchema)
module.exports = MonthlyReportModel