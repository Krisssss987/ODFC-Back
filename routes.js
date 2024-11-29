const express = require('express');
const auth = require('./authentication/authentication')
const data = require('./data/data')
const router = express.Router();

// authentication
router.post('/register', auth.register);
router.post('/login', auth.loginUser);
router.get('/user', auth.getUserDetails);


/*-------------------*/
router.post('/addEndStore', data.addEndStore);
router.post('/addComponent', data.addComponent);
router.post('/addGauge', data.addGauge);
router.post('/addCharacteristic', data.addCharacteristic);
router.post('/addSensorConfiguration', data.addSensorConfiguration);
router.post('/addSensorMapping', data.addSensorMapping);
router.get('/getEndStoresForOrganization/:organization_id', data.getEndStoresForOrganization);
router.get('/getComponentsForOrganization/:organization_id', data.getComponentsForOrganization);
router.get('/getGaugesForOrganization/:organization_id', data.getGaugesForOrganization);
router.post('/insertReport', data.insertReport);
router.get('/getReportDataById/:report_id', data.getReportDataById);
router.get('/getFullGaugeDataForOrganization/:organization_id', data.getFullGaugeDataForOrganization);
router.get('/getAllReports/:organization_id', data.getFullReportDataForOrganization);

// get
// router.get('/endStore/:organization_id', data.getEndStoreWithComponentsByOrganization);
// router.get('/getGauges/:organization_id', data.getGaugesWithCharacters);
// router.get('/getAllData/:component_id', data.getDataByComponent);



// // post
// router.post('/addData', data.insertData);

// // put
// router.post('/updateData/:data_id', data.updateData);

// // delete
// router.delete('/deleteData/:data_id', data.deleteData);

module.exports = router;
