const express = require('express');

// Import routers for v2
// const fnConvertRouter = require('../routes/staff/v2/convert-fn');
const workerRouter = require('../routes/controller/v2/worker');
// const authRouter = require('../routes/staff/v2/auth');
const todoRouter = require('../routes/controller/v2/todo');
const l2Router = require('../routes/controller/v2/L2');
const workRouter = require('../routes/controller/v2/work');

module.exports = (app) => {

    // Define v2 routes
    // app.use('/c/v2/fn-convert', fnConvertRouter);
    app.use('/c/v2/worker', workerRouter);
    // app.use('/c/v2/auth', authRouter);
    app.use('/c/v2/todo', todoRouter);
    app.use('/c/v2/L2', l2Router);
    app.use('/c/v2/work', workRouter);
};