const express = require('express');
const auth = require('./authentication/authentication')
const data = require('./data/data')
const router = express.Router();

// authentication
router.post('/register', auth.register);
router.post('/login', auth.loginUser);
router.get('/user', auth.getUserDetails);

// get
router.get('/endStore/:organization_id', data.getEndStoreWithComponentsByOrganization);
router.get('/getGauges/:organization_id', data.getGaugesWithCharacters);
router.get('/getAllData/:component_id', data.getDataByComponent);

// post
router.post('/addData', data.insertData);

// put
router.post('/updateData/:data_id', data.updateData);

// delete
router.delete('/deleteData/:data_id', data.deleteData);

module.exports = router;
