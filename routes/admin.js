const express = require('express')
const router = express.Router();
const { verifyAdmin } = require('../middlewares/verify-middleware')
const { postLogin } = require('../controllers/admin-controllers')
const { addDesignation, allDesignations, editDesignation, deleteDesignation
} = require('../controllers/designation-controllers')
const { addRegularWork } = require('../controllers/work-controllers')
const { getWorksData } = require('../controllers/staff-work-controller')



// Auth
router.post('/login', postLogin)

// Designation
router.post('/designation', verifyAdmin, addDesignation)
router.get('/designations', verifyAdmin, allDesignations)
router.put('/designation', verifyAdmin, editDesignation)
router.delete('/designation/:id', verifyAdmin, deleteDesignation)

// Work
router.post('/regular_work', verifyAdmin, addRegularWork)
router.get('/works-data', verifyAdmin, getWorksData)



module.exports = router