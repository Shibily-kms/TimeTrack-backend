const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGOURL)
        console.log(`database connected on  `);
    } catch (error) {
        throw error
    }
}

module.exports = connectDB