const cron = require('node-cron');
const { getDesignationsTimeArray } = require('../controllers/designation-controllers')
const { doAutoPunchOut } = require('../controllers/staff-work-controller')

// Designation Call
const DesignationsPunchOut = async () => {

    // Define punch-out times for each designation
    const punchOutTimes = await getDesignationsTimeArray();

    punchOutTimes.forEach((punchOutTime) => {

        const [punchOutHour, punchOutMinute] = punchOutTime.auto_punch_out.split(':');
        // const designation = punchOutTime.designation;

        const now = new Date();
        now.setHours(punchOutHour, punchOutMinute, 0);

        const cronExpression = `${now.getMinutes()} ${now.getHours()} ${now.getDate()} ${now.getMonth() + 1} *`;

        cron.schedule(cronExpression, () => {
            doAutoPunchOut(punchOutTime.name)
        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"
        });
    });
}

// Call daily at 01:30 PM
const autoPunchOut = () => {
    cron.schedule('50 19 * * *', () => {
        DesignationsPunchOut()
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
}




module.exports = { autoPunchOut }

