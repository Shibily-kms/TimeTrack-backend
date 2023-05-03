const express = require('express')
const router = express.Router();
const { verifyUser } = require('../middlewares/verify-middleware')

router.get('/', (req, res) => {
    res.send('user')
})

// Auth
const { doSignUp } = require('../controllers/user/auth-controllers')
router.post('/sign-up', doSignUp)


// Designation
const { getAllDesignation } = require('../controllers/user/designation-controllers')
router.get('/designations', getAllDesignation)

// 

module.exports = router