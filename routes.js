const express = require('express');
const auth = require('./authentication/authentication')
const data = require('./data/data')
const router = express.Router();

// authentication
router.post('/register', auth.register);
router.post('/login', auth.loginUser);
router.get('/user', auth.getUserDetails);

// get
router.get('/allData', data.getEndStoreWithComponents);
router.get('/gaugeData/:component_id', data.getGaugeDataByComponent);

// post
router.post('/charactersData', data.characterData);

module.exports = router;
