const errorHandler = (err, req, res, next) => {
    console.log(err)
    res.status(err.statusCode || 500).json(
        {   
            status : "error",
            statusCode: err.statusCode || 500,
            message: err.message || 'Something went wrong!',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack
        }
    )
}


module.exports = { errorHandler }
