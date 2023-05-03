const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const app = express() // Initializing express
const dotenv = require('dotenv').config()
const port = process.env.PORT || 5000;
const db = require('./config/db')


// routes
const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')


// dB connect

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database');
    // Perform database operations with the 'collection' object...
});


const { errorHandler } = require('./middlewares/error-middleware')

app.use(cors())
app.use(cookieParser())
// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: false }))


app.use('/', userRouter);
app.use('/admin', adminRouter);

app.use(errorHandler)


// Listen
app.listen(port, () => {
    console.log(`server is running in port ${port}`);
});








