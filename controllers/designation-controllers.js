const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const DesignationModel = require('../models/designation_models');
const { successResponse, errorResponse } = require('../helpers/response-helper')

const addDesignation = async (req, res, next) => {
    try {
        const { designation } = req.body

        if (!designation) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const existedDesignation = await DesignationModel.findOne({ designation })
        if (existedDesignation) {
            return res.status(400).json(errorResponse('This designation exists'))
        }

        const designationData = {
            designation,
            name: [],
            allow_origins: [],
            auto_punch_out: '17:30'
        }
        const newDesignation = await DesignationModel.create(designationData)

        res.status(201).json(successResponse('Designation created success', newDesignation))

    } catch (error) {
        next(error)
    }
}

const getDesignations = async (req, res, next) => {

    try {
        const { id } = req.query

        let designation = null

        if (id) {
            designation = await DesignationModel.findOne({ _id: new ObjectId(id), delete: { $ne: true } })
        } else {
            designation = await DesignationModel.find({ delete: { $ne: true } }).sort({ designation: 1 })
        }

        if (!designation) {
            return res.status(201).json(successResponse('No designations'))
        }

        res.status(201).json(successResponse('Designations list', designation))

    } catch (error) {
        next(error)
    }
}

const editDesignation = async (req, res, next) => {

    try {
        const { _id, designation } = req.body

        if (!_id || !designation) {
            return res.status(409).json(errorResponse('Request body is missing', 409))
        }

        const existDesignation = await DesignationModel.findOne({ designation, delete: { $ne: true } })
        if (existDesignation && _id != existDesignation?._id) {
            return res.status(400).json(errorResponse('Designation already Existed'))
        }

        await DesignationModel.updateOne({ _id: new ObjectId(_id) }, {
            $set: {
                designation
            }
        })

        res.status(201).json(successResponse('Designation Updated'))

    } catch (error) {
        next(error)
    }
}

const deleteDesignation = async (req, res, next) => {
    try {
        const { id } = req.query

        if (!id) {
            return res.status(409).json(errorResponse('Request query is missing', 409))
        }

        const thisDesignation = await DesignationModel.findOne({ _id: new ObjectId(id) })
        if (thisDesignation.name.length > 0) {
            return res.status(400).json(errorResponse('Cannot delete designations with staffs'))
        }

        await DesignationModel.updateOne({ _id: new ObjectId(id) }, { $set: { delete: true } })

        res.status(201).json(successResponse('Designation deleted'))

    } catch (error) {
        next(error)
    }
}

module.exports = {
    addDesignation, getDesignations, editDesignation, deleteDesignation
}