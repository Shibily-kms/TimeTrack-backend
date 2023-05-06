const YYYYMMDDFormat = (ISOdate) => {
    const year = ISOdate.getFullYear();
    const month = String(ISOdate.getMonth() + 1).padStart(2, '0');
    const day = String(ISOdate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

module.exports = { YYYYMMDDFormat }