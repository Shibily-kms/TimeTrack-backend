// External modules
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const dotenv = require('dotenv').config()

// Internal modules
const connectDB = require('./config/db')
const { schedulerFunction } = require('./controllers/auto-fun-controller')
const { errorHandler } = require('./middleware/error-middleware')

// Routes
const staffRouter = require('./routes/staff')
const adminRouter = require('./routes/admin')

// Initial express app
const app = express()
const port = process.env.PORT || 8000;

// Connect to the database
connectDB()

// Perform auto punch out
try {
    schedulerFunction();
} catch (err) {
    console.error('Auto punch out error:', err);
}

// Middleware
app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Define routes
app.use('/admin', adminRouter);
app.use('/', staffRouter);

// Error handling middleware
app.use(errorHandler)

// Start the server
app.listen(port, () => {
    console.log(`Server is running in port ${port}`);
});
