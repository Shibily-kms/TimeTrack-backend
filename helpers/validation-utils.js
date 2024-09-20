const leaveLetterValidation = (arrayData) => {
    // Utility function to validate time in HH:MM format
    const validateTime = (time) => {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
    };

    // Utility function to validate date
    const validateDate = (date) => {
        return !isNaN(Date.parse(date));
    };

    // Validate the requested_days array
    const validateRequestedDays = (days) => {
        if (!Array.isArray(days) || days.length === 0) {
            return false;
        }

        return days.every(day => {
            if (!Array.isArray(day) || day.length !== 4) return false;

            const [date, type, startTime, endTime] = day;

            // Validate date
            if (!validateDate(date)) return false;

            // Validate type (should be 1 or 0.5)
            if (typeof type !== 'number' || (type !== 1 && type !== 0.5)) return false;

            // Validate start and end time
            if (!validateTime(startTime) || !validateTime(endTime)) return false;

            return true;
        });
    };

    if (!arrayData[0]) {
        return ['error', 409, 'Request body is missing']
    }

    if (!validateRequestedDays(arrayData)) {
        return ['error', 400, 'Invalid requested_days format']
    }

}


module.exports = {
    leaveLetterValidation
}