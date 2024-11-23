const express = require('express');
const auth = require('./authentication/authentication')
const data = require('./data/data')
const router = express.Router();

// authentication
router.post('/register', auth.register);
router.post('/login', auth.loginUser);
router.get('/user', auth.getUserDetails);

// data
router.get('/allData', data.getEndStoreWithComponents);
router.get('/gaugeData/:component_id', data.getGaugeDataByComponent);

module.exports = router;
