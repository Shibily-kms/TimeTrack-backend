const express = require('express')
const router = express.Router();
const { verifyAdmin } = require('../middlewares/verify-middleware')
const { postLogin } = require('../controllers/admin-controllers')
const { addDesignation, allDesignations, editDesignation, deleteDesignation
} = require('../controllers/designation-controllers')
const { addRegularWork, getAllWorks, editRegularWork, deleteRegularWork } = require('../controllers/work-controllers')
const { getWorksData } = require('../controllers/staff-work-controller')
const { getAllStaffs, deleteStaff } = require('../controllers/user-controllers')


// Auth
router.post('/login', postLogin)

// Designation
router.post('/designation', verifyAdmin, addDesignation)
router.get('/designations', verifyAdmin, allDesignations)
router.put('/designation', verifyAdmin, editDesignation)
router.delete('/designation/:id', verifyAdmin, deleteDesignation)

// Work
router.get('/regular-work/:designation', verifyAdmin, getAllWorks)
router.post('/regular-work', verifyAdmin, addRegularWork)
router.put('/regular-work', verifyAdmin, editRegularWork)
router.delete('/regular-work/:work_Id', verifyAdmin, deleteRegularWork)
router.get('/works-data', verifyAdmin, getWorksData)

// Staff
router.get('/all-staff', verifyAdmin, getAllStaffs);
router.delete('/staff/:id',verifyAdmin,deleteStaff)




module.exports = router