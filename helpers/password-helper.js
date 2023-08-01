const generatePassword = (length = 6, firstLetter = '') => {
    const inputs = '123456789'
    let randomString = '';
    for (var i, i = 0; i < length; i++) {
        randomString += inputs.charAt(Math.floor(Math.random() * inputs.length))
    }
    return firstLetter + randomString
}

module.exports = { generatePassword }