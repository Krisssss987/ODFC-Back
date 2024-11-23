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
router.post('/addCharacter', data.characterData);

// put
router.post('/updateCharacter/:character_id', data.updateCharacterData);

// delete
router.delete('/deleteCharacter/:character_id', data.deleteCharacterData);

module.exports = router;
