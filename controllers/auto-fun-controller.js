const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const cron = require('node-cron');
const DesignationModel = require('../models/designation_models');
const StaffModal = require("../models/staff-model")
const { doAutoPunchOut } = require('../controllers/staff-work-controller')
const { generateMonthlyWorkReport } = require('../controllers/staff-work-controller')


const schedulerFunction = async () => {
    try {

        // Get all scheduled tasks
        const scheduledTasks = cron.getTasks();
        // Cancel all scheduled tasks
        scheduledTasks.forEach((task) => {
            task.stop();
        });


        //* Auto Punch Out Function Work    ------------ START
        // Get Staff For Auto punchOut
        let staffList = await StaffModal.find({ delete: { $ne: true }, punch_type: { $in: ['software', 'firstInScanner'] } })

        staffList = staffList.map((obj) => {
            if (!obj.auto_punch_out) {
                return {
                    ...obj._doc,
                    auto_punch_out: '17:30'
                }
            }
            return obj
        })

        // Loop All staff for punch out
        staffList.map((staff) => {
            const [punchOutHour, punchOutMinute] = staff.auto_punch_out.split(':');
            const designation = staff.designation;

            // Set Schedules
            const cronExpression = `0 ${punchOutMinute} ${punchOutHour} * * *`;
            cron.schedule(cronExpression, async () => {
                await doAutoPunchOut(staff._id)
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata"
            });
        })

        //* Auto Punch Out Function Work    ------------ END

        //! Auto Generate Salary Report     ------------ START
        cron.schedule('0 0 3 1 * *', () => {
            generateMonthlyWorkReport()
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });

        //! Auto Generate Salary Report     ------------ END


        return;

    } catch (error) {
        return error;
    }

}


module.exports = {
    schedulerFunction
}