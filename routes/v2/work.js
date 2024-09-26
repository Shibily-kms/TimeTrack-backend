const express = require('express');
const router = express.Router();
const { verifyToken, verifyOrigin } = require('../../middleware/verify-middleware')
const staffController = require('../../controllers/staff-controllers')
const workController = require('../../controllers/staff-work-controller')

//? Base Route : /v2/work
//? Base In Domain : api.staff.domain.com/v2/work/

router.put('/punch', verifyToken, verifyOrigin(['ttcr_anlz_write']), workController.changeWorkTime)


module.exports = router