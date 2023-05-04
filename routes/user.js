const express = require('express')
const router = express.Router();
const { verifyUser } = require('../middlewares/verify-middleware')

router.get('/', (req, res) => {
    res.send('user')
})

// Auth
const { doSignUp, doLogin } = require('../controllers/user-controllers')
router.post('/sign-up', doSignUp)
router.post('/login', doLogin)


// Designation
const { allDesignations } = require('../controllers/designation-controllers')
router.get('/designations', allDesignations)

// 

module.exports = router