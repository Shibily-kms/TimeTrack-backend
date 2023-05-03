const express = require('express')
const router = express.Router();
const { verifyAdmin } = require('../middlewares/verify-middleware')

router.get('/', (req, res) => {
    res.send('admin')
})

// Auth
const { postLogin } = require('../controllers/admin/auth-controllers')
router.post('/login', postLogin)

// Designation
const { addDesignation } = require('../controllers/admin/designation-controllers')
router.post('/designation', verifyAdmin, addDesignation)



module.exports = router