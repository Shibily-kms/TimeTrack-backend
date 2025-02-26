const leaveDateTextFormate = (dateArray) => {
    return dateArray?.length > 1
        ? `${new Date(dateArray?.[0]?.[0]).toDateString()} to ${new Date(dateArray?.[dateArray?.length - 1]?.[0]).toDateString()} (${dateArray?.length} Days)`
        : `${new Date(dateArray?.[0]?.[0]).toDateString()} (${Number(dateArray?.[0]?.[1]) < 1 ? dateArray?.[0]?.[2] === '09:30' ? 'Before noon' : 'After noon' : '1 Day'})`
}


const findLeaveLetterStatus = (requested, approved) => {
    const requestedDays = requested?.sort((a, b) => a[0] - b[0]) || []
    const approvedDays = approved?.sort((a, b) => a[0] - b[0]) || []

    let edited = false

    for (let i = 0; i < requestedDays.length; i++) {
        const element = requestedDays[i];

        if (!approvedDays[i] || element[0] !== approvedDays[i][0] || element[1] !== approvedDays[i][1] || element[2] !== approvedDays[i][2] || element[3] !== approvedDays[i][3]) {
            edited = true
            break;
        }
    }

    return edited ? 'Approved With Modified' : 'Approved'
}


module.exports = { leaveDateTextFormate, findLeaveLetterStatus }