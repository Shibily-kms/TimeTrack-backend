const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const cron = require('node-cron');
const DesignationModel = require('../models/designation_models');
const WorkModel = require('../models/work_model')
const { doAutoPunchOut } = require('../controllers/staff-work-controller')

const addDesignation = async (req, res) => {
    try {

        const { designation } = req.body
        let exist = await DesignationModel.findOne({ designation })
        if (exist) {
            res.status(400).json({ status: false, message: 'This designation exist' })
        } else {
            const new_designation = {
                designation,
                name: [],
                allow_sales: false,
                auto_punch_out: '17:30'
            }
            DesignationModel.create(new_designation).then((response) => {
                res.status(201).json({ status: true, data: response, message: 'new designation created' })
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

const editDesignation = async (req, res) => {

    try {
        let { _id, designation, allow_sales, auto_punch_out } = req.body
        let exist = await DesignationModel.findOne({ designation })
        if (!exist || _id === exist?.id) {
            DesignationModel.updateOne({ _id: new ObjectId(_id) }, {
                $set: {
                    designation,
                    allow_sales,
                    auto_punch_out,
                }
            }).then(async () => {
                autoPunchOutHelper()
                // getDesignationsTimeArray().then((times) => {
                //     designationsPunchOut(times)
                res.status(201).json({ status: true, message: 'Designation Updated' })
                // })
            })
        } else {
            res.status(400).json({ status: false, message: 'Already Existed' })
        }

    } catch (error) {
        throw error
    }
}

const deleteDesignation = async (req, res) => {
    try {
        const { id } = req.params
        let designation = await DesignationModel.findOne({ _id: new ObjectId(id) })
        if (designation.name.length > 0) {
            res.status(400).json({ status: false, message: 'Delete staffs from designation' })
        } else {
            DesignationModel.deleteOne({ _id: new ObjectId(id) }).then(() => {
                WorkModel.deleteOne({ designation: new ObjectId(id) }).then(() => {
                    res.status(201).json({ status: true, message: 'Deleted' })
                })
            })
        }
    } catch (error) {
        throw error
    }
}

const autoPunchOutHelper = () => {
    // Get Auto Times
    DesignationModel.find({}, { designation: 1, name: 1, auto_punch_out: 1, _id: 0 }).then((designations) => {
        designations = designations.map((obj) => {
            if (!obj.auto_punch_out) {
                return {
                    ...obj._doc,
                    auto_punch_out: '17:30'
                }
            }
            return obj
        })

        // Get all scheduled tasks
        const scheduledTasks = cron.getTasks();
        // Cancel all scheduled tasks
        scheduledTasks.forEach((task) => {
            task.stop();
        });

        // Loop All Designations
        designations.forEach((punchOutTime) => {
            const [punchOutHour, punchOutMinute] = punchOutTime.auto_punch_out.split(':');
            const designation = punchOutTime.designation;

            // Set Schedules
            const cronExpression = `0 ${punchOutMinute} ${punchOutHour} * * *`;
            cron.schedule(cronExpression, () => {
                doAutoPunchOut(punchOutTime.name)
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata"
            });
        });

        return;
    })

}


module.exports = {
    addDesignation, allDesignations, editDesignation, deleteDesignation, autoPunchOutHelper
}