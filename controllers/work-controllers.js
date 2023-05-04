const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const DesignationModel = require('../models/designation_models');
const WorkModel = require('../models/work_model')

const addRegularWork = async (req, res) => {
    try {
        const { designation, regular_work } = req.body

        WorkModel.findOneAndUpdate({ designation: new ObjectId(designation), works: { $nin: [regular_work] } }, {
            $set: {
                designation
            },
            $push: {
                works: regular_work
            }
        }, { upsert: true, new: true }).then(() => {
            res.status(201).json({ status: true, message: 'new work added' })
        }).catch((error) => {
            res.status(400).json({ status: false, message: 'this work exist' })
        })
    } catch (error) {
        res.status(400).json({ status: false, message: 'try now' })
        throw error
    }
}


module.exports = {
    addRegularWork
}