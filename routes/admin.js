const express = require('express')
const router = express.Router();
const { verifyAdmin } = require('../middlewares/verify-middleware')
const { postLogin } = require('../controllers/admin-controllers')
const { addDesignation, allDesignations, setDesignationSettings
} = require('../controllers/designation-controllers')
const { addRegularWork } = require('../controllers/work-controllers')
const { getWorksData } = require('../controllers/staff-work-controller')



// Auth
router.post('/login', postLogin)

// Designation
router.post('/designation', verifyAdmin, addDesignation)
router.get('/designations', verifyAdmin, allDesignations)
router.put('/designation/settings', verifyAdmin, setDesignationSettings)

// Work
router.post('/regular_work', verifyAdmin, addRegularWork)
router.get('/works-data', verifyAdmin, getWorksData)



module.exports = router