const YYYYMMDDFormat = (ISOdate) => {
    const year = ISOdate.getFullYear();
    const month = String(ISOdate.getMonth() + 1).padStart(2, '0');
    const day = String(ISOdate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

Date.prototype.getWeek = function () {
    const dt = new Date(this);
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + 4 - (dt.getDay() || 7));
    const yearStart = new Date(dt.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};



module.exports = { YYYYMMDDFormat, Date }