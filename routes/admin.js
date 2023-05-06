const express = require('express')
const router = express.Router();
const { verifyAdmin } = require('../middlewares/verify-middleware')

router.get('/', (req, res) => {
    res.send('admin')
})

// Auth
const { postLogin } = require('../controllers/admin-controllers')
router.post('/login', postLogin)

// Designation
const { addDesignation, allDesignations } = require('../controllers/designation-controllers')
router.post('/designation', verifyAdmin, addDesignation)
router.get('/designations', verifyAdmin, allDesignations)


// Work
const { addRegularWork } = require('../controllers/work-controllers')
const { getWorksData } = require('../controllers/staff-work-controller')
router.post('/regular_work', verifyAdmin, addRegularWork)
router.get('/works-data', verifyAdmin, getWorksData)



module.exports = router