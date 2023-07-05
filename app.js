const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const app = express() // Initializing express
const dotenv = require('dotenv').config()
const port = process.env.PORT || 8000;
const connectDB = require('./config/db')
const { autoPunchOut } = require('./helpers/auto-punchOut')

// routes
const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')

// dB connect
connectDB()

// Auto PunchOut
autoPunchOut()

const { errorHandler } = require('./middlewares/error-middleware')

// Middleware
app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/', userRouter);
app.use('/admin', adminRouter);

app.use(errorHandler)


// Listen
app.listen(port, () => {
    console.log(`server is running in port ${port}`);
});
