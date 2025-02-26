
// Import routers for v2
const workerRouter = require('../routes/controller/v2/worker');


module.exports = (app) => {

    // Define v2 routes
    app.use('/p/v2/worker', workerRouter);
  
};