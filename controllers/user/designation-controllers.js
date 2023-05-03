const DesignationModel = require('../../models/designation_models')

const getAllDesignation = async (req, res) => {

    try {
        let add_designations = await DesignationModel.find()
        res.status(201).json({ status: true, designations: add_designations, message: 'get all designations' })

    } catch (error) {
        res.status(400).json({ status: false, meesage: 'not get' })
    }
}

module.exports = { getAllDesignation }