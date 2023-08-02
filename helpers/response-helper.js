// Response format for success
const successResponse = (message = "", data = null, statusCode = 201) => {
    let response = {
        status: "success",
        statusCode,
        message,
    }
    if (data) response.data = data

    return response;
};

// Response format for error
const errorResponse = (message = "", statusCode = 400, data = null) => {
    let response = {
        status: "error",
        statusCode,
        message
    }
    if (data) response.data = data
    
    return response
};

module.exports = { successResponse, errorResponse }