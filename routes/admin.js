const express = require('express')
const router = express.Router();

router.get('/', (req, res) => {
    res.send('admin')
})

// Auth
const { postLogin } = require('../controllers/admin/auth-controllers')
router.post('/login', postLogin)



module.exports = router