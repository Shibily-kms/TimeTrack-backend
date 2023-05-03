const DesignationModel = require('../../models/designation_models');

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


module.exports = {
    addDesignation
}