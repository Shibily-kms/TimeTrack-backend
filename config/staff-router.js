const express = require('express');

// Import routers for v2
const fnConvertRouter = require('../routes/staff/v2/convert-fn');
const workerRouter = require('../routes/staff/v2/worker');
const authRouter = require('../routes/staff/v2/auth');
const todoRouter = require('../routes/staff/v2/todo');
const l2Router = require('../routes/staff/v2/L2');
const workRouter = require('../routes/staff/v2/work');

module.exports = (app) => {

    // Define v2 routes
    app.use('/s/v2/fn-convert', fnConvertRouter);
    app.use('/s/v2/worker', workerRouter);
    app.use('/s/v2/auth', authRouter);
    app.use('/s/v2/todo', todoRouter);
    app.use('/s/v2/L2', l2Router);
    app.use('/s/v2/work', workRouter);
};