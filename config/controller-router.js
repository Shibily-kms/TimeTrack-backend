
// Import routers for v2
const workerRouter = require('../routes/controller/v2/worker');
const todoRouter = require('../routes/controller/v2/todo');
const l2Router = require('../routes/controller/v2/L2');
const workRouter = require('../routes/controller/v2/work');

module.exports = (app) => {

    // Define v2 routes
    app.use('/c/v2/worker', workerRouter);
    app.use('/c/v2/todo', todoRouter);
    app.use('/c/v2/L2', l2Router);
    app.use('/c/v2/work', workRouter);
};