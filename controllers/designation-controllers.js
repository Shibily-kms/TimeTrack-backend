const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const DesignationModel = require('../models/designation_models');

const addDesignation = async (req, res) => {
    try {

        const { designation } = req.body
        let exist = await DesignationModel.findOne({ designation })
        if (exist) {
            res.status(400).json({ status: false, message: 'This designation exist' })
        } else {
            const new_designation = {
                designation,
                name: []
            }
            DesignationModel.create(new_designation).then((response) => {
                res.status(201).json({ status: true, message: 'new designation created' })
            }).catch((error) => {
                res.status(400).json({ status: false, message: 'Enter designation' })
            })
        }
    } catch (error) {
        throw error
    }
}

const allDesignations = async (req, res) => {

    try {
        let { id } = req.query
        let designation = null
        if (id) {
            designation = await DesignationModel.findOne({ _id: new ObjectId(id) })
            res.status(201).json({ status: true, designation: designation, message: 'get designations' })
        } else {
            designation = await DesignationModel.find()
            res.status(201).json({ status: true, designations: designation, message: 'get all designations' })
        }

    } catch (error) {
        res.status(400).json({ status: false, meesage: 'not get' })
    }
}

const changeStatusOfSales = (req, res) => {
    try {
        let { id, status } = req.body
        DesignationModel.updateOne({ _id: new ObjectId(id) }, {
            $set: {
                allow_sales: !status
            }
        }).then(() => {
            res.status(201).json({ status: false, message: 'status changed' })
        })
    } catch (error) {
        throw error
    }
}

module.exports = {
    addDesignation, allDesignations, changeStatusOfSales
}