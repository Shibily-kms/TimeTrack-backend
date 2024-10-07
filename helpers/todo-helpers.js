const { YYYYMMDDFormat } = require("./dateUtils");

const nextDayInMonth = (dateArray, targetDate) => {
    const target = new Date(targetDate).getDate()

    // Filter numbers greater than 30
    const greaterThanTarget = dateArray.filter(num => num >= target);

    // Create a new date object based on the target date
    const targetDateObj = new Date(targetDate);

    // Get the last date of the month for the target date
    const lastDateOfMonth = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth() + 1, 0).getDate();

    if (greaterThanTarget.length > 0) {


        if (lastDateOfMonth < Math.min(...greaterThanTarget)) {

            // If the last date of the month is less than the nearest greater number
            targetDateObj.setMonth(targetDateObj.getMonth() + 1);
            targetDateObj.setDate(Math.min(...dateArray));

        } else {
            // Set the date to the nearest greater number
            targetDateObj.setDate(Math.min(...greaterThanTarget));
        }
    } else {
        // If there are no numbers greater than the target
        targetDateObj.setMonth(targetDateObj.getMonth() + 1);
        targetDateObj.setDate(Math.min(...dateArray));
    }

    // Return the result date
    return targetDateObj;
}

const nextDayInWeek = (dayArray, targetDate) => {
    const target = new Date(targetDate).getDay()

    // Find the next valid day
    const futureDays = dayArray.filter(day => day >= target);
    const nextDay = futureDays.length > 0 ? Math.min(...futureDays) : Math.min(...dayArray); // Wrap around if no next day found
    const daysUntilNext = (nextDay - target + 7) % 7; // Calculate days until next valid day

    let nextValidDate = new Date(targetDate);
    nextValidDate.setDate(targetDate.getDate() + daysUntilNext);

    return nextValidDate;
}

const nextTodoTaskDate = (frequency, periods, start_date, start_time) => {

    let due_date = null
    let is_daily = true

    switch (frequency) {
        case 3:
            // Due date and is daily
            let dueISOmonth = nextDayInMonth(periods, new Date(start_date || new Date()))
            if (start_time) {
                dueISOmonth = new Date(`${YYYYMMDDFormat(dueISOmonth)}T${start_time}`)
                is_daily = false
            }
            due_date = dueISOmonth

            break;

        case 2:
            // Due date and is daily
            let dueISOweek = nextDayInWeek(periods, new Date(start_date || new Date()))

            if (start_time) {
                dueISOweek = new Date(`${YYYYMMDDFormat(dueISOweek)}T${start_time}`)
                is_daily = false
            }
            due_date = dueISOweek

            break;

        case 1:
            // Due date and is daily
            let dueISODay = new Date(start_date || new Date())
            if (start_time) {
                dueISODay = new Date(`${YYYYMMDDFormat(dueISODay)}T${start_time}`)
                is_daily = false
            }
            due_date = dueISODay

            break;

        default:

            // Due date and is daily
            let dueISO = null

            if (start_date) {
                dueISO = new Date(start_date || new Date())
            }
            if (start_time) {
                dueISO = new Date(`${YYYYMMDDFormat(dueISO)}T${start_time}`)
                is_daily = false
            }

            due_date = dueISO
            break;
    }

    return { due_date, is_daily }

}

module.exports = { nextDayInMonth, nextDayInWeek, nextTodoTaskDate }