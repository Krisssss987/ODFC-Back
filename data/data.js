const bcrypt = require('bcrypt');
const db = require('../db');
const jwtUtils = require('../token/jwtUtils');
const { v4: uuidv4 } = require('uuid');

async function addEndStore(req, res) {
    const { end_store_name, organization_id } = req.body;

    // Generate a new UUID for the end store
    const end_store_id = uuidv4();

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Check if an end store with the same name exists for the given organization
        const CheckEndStoreExistQuery = `
            SELECT * 
            FROM odfc.odfc_end_store 
            WHERE end_store_name = $1 AND organization_id = $2;
        `;
        const endStoreResult = await client.query(CheckEndStoreExistQuery, [end_store_name, organization_id]);

        if (endStoreResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'End store already exists for this organization' });
        }

        // Insert the new end store
        const InsertEndStoreQuery = `
            INSERT INTO odfc.odfc_end_store 
            (end_store_id, end_store_name, organization_id) 
            VALUES ($1, $2, $3);
        `;
        await client.query(InsertEndStoreQuery, [end_store_id, end_store_name, organization_id]);

        await client.query('COMMIT');

        res.status(201).json({ message: 'End store added successfully', end_store_id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during end store creation:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();
    }
}

async function addComponent(req, res) {
    const { component_name, organization_id } = req.body;

    // Generate a new UUID for the component
    const component_id = uuidv4();

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Check if a component with the same name exists for the given organization
        const CheckComponentExistQuery = `
            SELECT * 
            FROM odfc.odfc_component 
            WHERE component_name = $1 AND organization_id = $2;
        `;
        const componentResult = await client.query(CheckComponentExistQuery, [component_name, organization_id]);

        if (componentResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Component already exists for this organization' });
        }

        // Insert the new component
        const InsertComponentQuery = `
            INSERT INTO odfc.odfc_component 
            (component_id, component_name, organization_id) 
            VALUES ($1, $2, $3);
        `;
        await client.query(InsertComponentQuery, [component_id, component_name, organization_id]);

        await client.query('COMMIT');

        res.status(201).json({ message: 'Component added successfully', component_id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during component creation:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();
    }
}

async function addGauge(req, res) {
    const { gauge_name, gauge_odfc_id, organization_id } = req.body;

    // Generate a new UUID for the gauge
    const gauge_id = uuidv4();

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Check if a gauge with the same name and ODFC ID exists for the given organization
        const CheckGaugeExistQuery = `
            SELECT * 
            FROM odfc.odfc_gauge 
            WHERE gauge_name = $1 AND gauge_odfc_id = $2 AND organization_id = $3;
        `;
        const gaugeResult = await client.query(CheckGaugeExistQuery, [gauge_name, gauge_odfc_id, organization_id]);

        if (gaugeResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Gauge already exists for this organization' });
        }

        // Insert the new gauge
        const InsertGaugeQuery = `
            INSERT INTO odfc.odfc_gauge 
            (gauge_id, gauge_name, gauge_odfc_id, organization_id) 
            VALUES ($1, $2, $3, $4);
        `;
        await client.query(InsertGaugeQuery, [gauge_id, gauge_name, gauge_odfc_id, organization_id]);

        await client.query('COMMIT');

        res.status(201).json({ message: 'Gauge added successfully', gauge_id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during gauge creation:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();
    }
}

async function addCharacteristic(req, res) {
    const { characteristic_name, gauge_id } = req.body;

    // Generate a new UUID for the characteristic
    const characteristic_id = uuidv4();

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Check if the gauge ID exists in the `odfc_gauge` table
        const CheckGaugeExistQuery = `
            SELECT * 
            FROM odfc.odfc_gauge 
            WHERE gauge_id = $1;
        `;
        const gaugeResult = await client.query(CheckGaugeExistQuery, [gauge_id]);

        if (gaugeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Gauge not found' });
        }

        // Check if a characteristic with the same name exists for the given gauge
        const CheckCharacteristicExistQuery = `
            SELECT * 
            FROM odfc.odfc_characteristics 
            WHERE characteristic_name = $1 AND gauge_id = $2;
        `;
        const characteristicResult = await client.query(CheckCharacteristicExistQuery, [characteristic_name, gauge_id]);

        if (characteristicResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Characteristic already exists for this gauge' });
        }

        // Insert the new characteristic
        const InsertCharacteristicQuery = `
            INSERT INTO odfc.odfc_characteristics 
            (characteristic_id, characteristic_name, gauge_id) 
            VALUES ($1, $2, $3);
        `;
        await client.query(InsertCharacteristicQuery, [characteristic_id, characteristic_name, gauge_id]);

        await client.query('COMMIT');

        res.status(201).json({ message: 'Characteristic added successfully', characteristic_id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during characteristic creation:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();
    }
}

async function addSensorConfiguration(req, res) {
    const { host, port, datatype, byte_order, speed, count, gauge_id, registerType } = req.body;

    // Generate a new UUID for the sensor
    const sensor_id = uuidv4();

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Validate that the gauge ID exists in the `odfc_gauge` table
        const CheckGaugeExistQuery = `
            SELECT * 
            FROM odfc.odfc_gauge 
            WHERE gauge_id = $1;
        `;
        const gaugeResult = await client.query(CheckGaugeExistQuery, [gauge_id]);

        if (gaugeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Gauge not found' });
        }

        // Insert the new sensor configuration
        const InsertSensorConfigQuery = `
            INSERT INTO odfc.odfc_sensor_configuration 
            (sensor_id, host, port, datatype, byte_order, speed, count, gauge_id, registerType) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `;
        await client.query(InsertSensorConfigQuery, [
            sensor_id,
            host,
            port,
            datatype,
            byte_order,
            speed,
            count,
            gauge_id,
            registerType
        ]);

        await client.query('COMMIT');

        res.status(201).json({ message: 'Sensor configuration added successfully', sensor_id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during sensor configuration creation:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();
    }
}

async function addSensorMapping(req, res) {
    const { sensor_id, characteristic_id, register_address } = req.body;

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Validate that the sensor_id exists in the `odfc_sensor_configuration` table
        const CheckSensorExistQuery = `
            SELECT * 
            FROM odfc.odfc_sensor_configuration 
            WHERE sensor_id = $1;
        `;
        const sensorResult = await client.query(CheckSensorExistQuery, [sensor_id]);

        if (sensorResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Sensor not found' });
        }

        // Validate that the characteristic_id exists in the `odfc_characteristics` table
        const CheckCharacteristicExistQuery = `
            SELECT * 
            FROM odfc.odfc_characteristics 
            WHERE characteristic_id = $1;
        `;
        const characteristicResult = await client.query(CheckCharacteristicExistQuery, [characteristic_id]);

        if (characteristicResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Characteristic not found' });
        }

        // Insert the new sensor mapping
        const InsertSensorMappingQuery = `
            INSERT INTO odfc.odfc_sensor_mapping 
            (sensor_id, characteristic_id, register_address) 
            VALUES ($1, $2, $3);
        `;
        await client.query(InsertSensorMappingQuery, [
            sensor_id,
            characteristic_id,
            register_address
        ]);

        await client.query('COMMIT');

        res.status(201).json({ message: 'Sensor mapping added successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during sensor mapping creation:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();
    }
}

async function getEndStoresForOrganization(req, res) {
    const { organization_id } = req.params; // Organization ID passed as a parameter

    const client = await db.connect();

    try {
        // Query to fetch all end stores for the given organization_id
        const GetEndStoresQuery = `
            SELECT end_store_id, end_store_name 
            FROM odfc.odfc_end_store
            WHERE organization_id = $1;
        `;

        const result = await client.query(GetEndStoresQuery, [organization_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No end stores found for this organization' });
        }

        // Return the list of end stores
        res.status(200).json({ endStores: result.rows });

    } catch (error) {
        console.error('Error fetching end stores:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();
    }
}

async function getComponentsForOrganization(req, res) {
    const { organization_id } = req.params; // Organization ID passed as a parameter

    const client = await db.connect();

    try {
        // Query to fetch all components for the given organization_id
        const GetComponentsQuery = `
            SELECT component_name as name, component_id as value
            FROM odfc.odfc_component
            WHERE organization_id = $1;
        `;

        const result = await client.query(GetComponentsQuery, [organization_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No components found for this organization' });
        }

        // Return the list of components
        res.status(200).json({ components: result.rows });

    } catch (error) {
        console.error('Error fetching components:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();
    }
}

async function getGaugesForOrganization(req, res) {
    const { organization_id } = req.params; // Organization ID passed as a parameter

    const client = await db.connect();

    try {
        // Query to fetch gauges and their characteristics for the given organization_id
        const GetGaugesWithCharacteristicsQuery = `
            SELECT
                g.gauge_name as name,
                g.gauge_id as value,
                g.gauge_odfc_id as ofdcGaugeNo,
                c.characteristic_name as characteristic_name,
                c.characteristic_id as characteristic_value
            FROM odfc.odfc_gauge g
            LEFT JOIN odfc.odfc_characteristics c ON g.gauge_id = c.gauge_id
            WHERE g.organization_id = $1;
        `;

        const result = await client.query(GetGaugesWithCharacteristicsQuery, [organization_id]);
        console.log(result);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No gauges found for this organization' });
        }

        // Transform data into the desired format
        const gauges = result.rows.reduce((acc, row) => {
            const existingGauge = acc.find(gauge => gauge.value === row.value);

            if (existingGauge) {
                existingGauge.characteristics.push({
                    name: row.characteristic_name,
                    value: row.characteristic_value,
                });
            } else {
                acc.push({
                    name: row.name,
                    value: row.value,
                    characteristics: [
                        { name: row.characteristic_name, value: row.characteristic_value },
                    ],
                    ofdcGaugeNo: row.ofdcgaugeno,
                });
            }

            return acc;
        }, []);

        // Return the list of gauges with characteristics
        res.status(200).json({ gauges });
        console.log(gauges)

    } catch (error) {
        console.error('Error fetching gauges and characteristics:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();
    }
}

async function getFullGaugeDataForOrganization(req, res) {
    const { organization_id } = req.params; // Organization ID passed as a parameter

    const client = await db.connect();

    try {
        // Query to fetch full data for gauges, sensor configurations, and characteristics
        const GetFullGaugeDataQuery = `
            SELECT
                g.gauge_id,
                g.gauge_name,
                g.gauge_odfc_id as ofdcGaugeNo,
                s.sensor_id,
                s.host,
                s.port,
                s.datatype,
                s.byte_order,
                s.registertype,
                s.speed,
                sm.register_address,
                c.characteristic_name,
                c.characteristic_id
            FROM odfc.odfc_gauge g
            LEFT JOIN odfc.odfc_sensor_configuration s ON g.gauge_id = s.gauge_id
            LEFT JOIN odfc.odfc_sensor_mapping sm ON s.sensor_id = sm.sensor_id
            LEFT JOIN odfc.odfc_characteristics c ON sm.characteristic_id = c.characteristic_id
            WHERE g.organization_id = $1;
        `;

        const result = await client.query(GetFullGaugeDataQuery, [organization_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No data found for this organization' });
        }

        // Return the result as is, as it's already in the desired structure
        res.status(200).json({ data: result.rows });

    } catch (error) {
        console.error('Error fetching full gauge data:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();
    }
}

async function insertReport(req, res) {
    const {
        user_id,
        organization_id,
        endStore,
        component,
        reportData,
        sinNo,
        lotNo,
        heatBatchNo,
        offeredQuantity,
        sampleQuantity
    } = req.body;

    // Generate a new UUID for the report_id
    const report_id = uuidv4();

    // Connect to the database
    const client = await db.connect();

    try {
        await client.query('BEGIN'); // Start a transaction

        // Check if the endStore, component, and organization IDs are valid (optional)
        const checkEndStoreQuery = `SELECT * FROM odfc.odfc_end_store WHERE end_store_id = $1;`;
        const endStoreResult = await client.query(checkEndStoreQuery, [endStore]);
        if (endStoreResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'End store not found' });
        }

        const checkComponentQuery = `SELECT * FROM odfc.odfc_component WHERE component_id = $1;`;
        const componentResult = await client.query(checkComponentQuery, [component]);
        if (componentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Component not found' });
        }

        // Insert data into the odfc_report table
        const insertReportQuery = `
            INSERT INTO odfc.odfc_report 
            (report_id, user_id, end_store_id, sin_no, lot_no, heat_batch_no, offered_quantity, 
            sample_quantity, organization_id, report_data, component_id) 
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `;
        await client.query(insertReportQuery, [
            report_id,
            user_id,
            endStore,
            sinNo,
            lotNo,
            heatBatchNo,
            offeredQuantity,
            sampleQuantity,
            organization_id,  // Assuming this is the organization_id as well
            JSON.stringify(reportData),
            component
        ]);

        await client.query('COMMIT');  // Commit the transaction

        res.status(201).json({ message: 'Report created successfully', report_id: report_id });

    } catch (error) {
        await client.query('ROLLBACK');  // Rollback in case of error
        console.error('Error inserting report:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        client.release();  // Release the client back to the pool
    }
}

async function getFullReportDataForOrganization(req, res) {
    const { organization_id } = req.params;  // Get organization_id from URL params

    // Database client connection
    const client = await db.connect();

    try {
        // SQL query to fetch report data with associated end store, component, and user details
        const query = `
            SELECT 
                r.report_id,
                r.created_at,
                r.sin_no,
                e.end_store_name,
                c.component_name,
                u.first_name || ' ' || u.last_name AS user_name  -- Concatenating first and last name
            FROM odfc.odfc_report r
            LEFT JOIN odfc.odfc_end_store e 
                ON r.end_store_id = e.end_store_id::VARCHAR  -- Cast UUID to VARCHAR
            LEFT JOIN odfc.odfc_component c 
                ON r.component_id = c.component_id::VARCHAR  -- Cast UUID to VARCHAR
            LEFT JOIN odfc.odfc_user_info u 
                ON r.user_id = u.user_id
            WHERE r.organization_id = $1;  -- Organization ID passed as a parameter
        `;

        // Execute the query and fetch the results
        const result = await client.query(query, [organization_id]);

        // Check if no data was found for the given organization_id
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No report data found for this organization' });
        }

        // Respond with the fetched data
        res.status(200).json({ data: result.rows });

    } catch (error) {
        // Log any errors that occur during query execution
        console.error('Error fetching report data:', error);
        res.status(500).json({ message: 'Internal server error' });

    } finally {
        // Release the database client back to the pool
        client.release();
    }
}

async function getReportDataById(req, res) {
    const { report_id } = req.params;

    const client = await db.connect();

    try {
        const query = `
            SELECT 
                r.report_id,
                r.created_at,
                r.sin_no,
                r.lot_no,
                r.heat_batch_no,
                r.offered_quantity,
                r.sample_quantity,
                r.report_data,
                e.end_store_name,
                c.component_name,
                u.first_name || ' ' || u.last_name AS user_name
            FROM odfc.odfc_report r
            LEFT JOIN odfc.odfc_end_store e ON r.end_store_id = e.end_store_id::VARCHAR
            LEFT JOIN odfc.odfc_component c ON r.component_id = c.component_id::VARCHAR
            LEFT JOIN odfc.odfc_user_info u ON r.user_id = u.user_id
            WHERE r.report_id = $1;
        `;

        const result = await client.query(query, [report_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No report data found for this report ID' });
        }

        const reportData = result.rows[0];
        const processedReportData = await processReportDataWithNames(reportData.report_data);

        const combinedResult = {
            ...reportData,
            report_data: processedReportData
        };

        res.status(200).json({ data: combinedResult });

    } catch (error) {
        console.error('Error fetching report data:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
}

async function processReportDataWithNames(reportDataJSON) {
    const processedData = await Promise.all(reportDataJSON.map(async (item) => {
        const gaugeName = await getGaugeName(item.gauge);
        const characteristicName = await getCharacteristicName(item.characteristic);

        return {
            ...item,
            gauge: gaugeName,
            characteristic: characteristicName
        };
    }));

    return processedData;
}

async function getGaugeName(gaugeId) {
    const query = 'SELECT gauge_name FROM odfc.odfc_gauge WHERE gauge_id = $1';
    const result = await db.query(query, [gaugeId]);

    if (result.rows.length > 0) {
        return result.rows[0].gauge_name;
    } else {
        return null;
    }
}

async function getCharacteristicName(characteristicId) {
    const query = 'SELECT characteristic_name FROM odfc.odfc_characteristics WHERE characteristic_id = $1';
    const result = await db.query(query, [characteristicId]);

    if (result.rows.length > 0) {
        return result.rows[0].characteristic_name;
    } else {
        return null;
    }
}



/*-------------------*/

async function getEndStoreWithComponentsByOrganization(req, res) {
    const { organization_id } = req.params; // Extract the organization_id from the request parameters

    const query = `
        SELECT
            es.end_store_id,
            es.end_store_name,
            es.sin_no,
            es.lot_no,
            es.heat_batch_no,
            es.offered_quantity,
            es.sample_quantity,
            c.component_id,
            c.component_name
        FROM
            odfc.odfc_end_store es
        LEFT JOIN
            odfc.odfc_component c
        ON
            es.end_store_id = c.end_store_id
        WHERE
            es.organization_id = $1;  -- Filter by organization_id
    `;

    try {
        const result = await db.query(query, [organization_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No end-store data found for the given organization ID' });
        }

        const endStoreMap = new Map();

        result.rows.forEach(row => {
            if (!endStoreMap.has(row.end_store_id)) {
                endStoreMap.set(row.end_store_id, {
                    end_store_id: row.end_store_id,
                    end_store_name: row.end_store_name,
                    sin_no: row.sin_no,
                    lot_no: row.lot_no,
                    heat_batch_no: row.heat_batch_no,
                    offered_quantity: row.offered_quantity,
                    sample_quantity: row.sample_quantity,
                    component: [],
                });
            }

            if (row.component_id && !endStoreMap.get(row.end_store_id).component.some(c => c.component_id === row.component_id)) {
                endStoreMap.get(row.end_store_id).component.push({
                    component_id: row.component_id,
                    component_name: row.component_name,
                });
            }
        });

        const responseData = Array.from(endStoreMap.values());

        res.status(200).json(responseData);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getDataByComponent(req, res) {
    const { component_id } = req.params;

    const query = `
        SELECT
            odfc_data.data_id,
            odfc_data.reference_no,
            odfc_data.ofdc_gauge_no,
            odfc_data.remark,
            odfc_data.other_remark,
            odfc_data.gauge_id,
            odfc_data.character_id,
            odfc_data.component_id,
            odfc_characters.character_name,
            odfc_gauge.gauge_type
        FROM
            odfc.odfc_data
        JOIN
            odfc.odfc_characters ON odfc_data.character_id = odfc_characters.character_id
        JOIN
            odfc.odfc_gauge ON odfc_data.gauge_id = odfc_gauge.gauge_id
        WHERE
            odfc_data.component_id = $1;
    `;

    try {
        const result = await db.query(query, [component_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No data found for the given component ID' });
        }
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getGaugesWithCharacters(req, res) {
    const { organization_id } = req.params;

    const query = `
        SELECT
            g.gauge_id,
            g.gauge_type,
            c.character_id,
            c.character_name
        FROM
            odfc.odfc_gauge g
        LEFT JOIN
            odfc.odfc_characters c
        ON
            g.gauge_id = c.gauge_id
        WHERE
            g.organization_id = $1;
    `;

    try {
        const result = await db.query(query, [organization_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No gauges found for the given organization ID' });
        }

        const gaugeMap = new Map();

        result.rows.forEach(row => {
            if (!gaugeMap.has(row.gauge_id)) {
                gaugeMap.set(row.gauge_id, {
                    gauge_id: row.gauge_id,
                    gauge_type: row.gauge_type,
                    characters: [],
                });
            }

            if (row.character_id) {
                gaugeMap.get(row.gauge_id).characters.push({
                    character_id: row.character_id,
                    character_name: row.character_name,
                });
            }
        });

        const responseData = Array.from(gaugeMap.values());

        res.status(200).json(responseData);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function insertData(req, res) {
    const {
        reference_no,
        ofdc_gauge_no,
        remark,
        other_remark,
        gauge_id,
        character_id,
        component_id
    } = req.body;

    const data_id = uuidv4();
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const CheckGaugeQuery = `SELECT * FROM odfc.odfc_gauge WHERE gauge_id = $1;`;
        const gaugeResult = await client.query(CheckGaugeQuery, [gauge_id]);
        if (gaugeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Gauge not found' });
        }

        const CheckCharacterQuery = `SELECT * FROM odfc.odfc_characters WHERE character_id = $1;`;
        const characterResult = await client.query(CheckCharacterQuery, [character_id]);
        if (characterResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Character not found' });
        }

        const CheckComponentQuery = `SELECT * FROM odfc.odfc_component WHERE component_id = $1;`;
        const componentResult = await client.query(CheckComponentQuery, [component_id]);
        if (componentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Component not found' });
        }

        // Insert the new data
        const InsertDataQuery = `
            INSERT INTO odfc.odfc_data 
            (data_id, reference_no, ofdc_gauge_no, remark, other_remark, gauge_id, character_id, component_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `;
        await client.query(InsertDataQuery, [
            data_id, reference_no, ofdc_gauge_no, remark, other_remark, gauge_id, character_id, component_id
        ]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Data inserted successfully', data_id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during data insertion:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
}

async function updateData(req, res) {
    const {
        reference_no,
        ofdc_gauge_no,
        remark,
        other_remark,
        gauge_id,
        character_id,
        component_id
    } = req.body;

    const { data_id } = req.params;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const CheckDataQuery = `SELECT * FROM odfc.odfc_data WHERE data_id = $1;`;
        const dataResult = await client.query(CheckDataQuery, [data_id]);
        if (dataResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Data not found' });
        }

        const CheckGaugeQuery = `SELECT * FROM odfc.odfc_gauge WHERE gauge_id = $1;`;
        const gaugeResult = await client.query(CheckGaugeQuery, [gauge_id]);
        if (gaugeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Gauge not found' });
        }

        const CheckCharacterQuery = `SELECT * FROM odfc.odfc_characters WHERE character_id = $1;`;
        const characterResult = await client.query(CheckCharacterQuery, [character_id]);
        if (characterResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Character not found' });
        }

        const CheckComponentQuery = `SELECT * FROM odfc.odfc_component WHERE component_id = $1;`;
        const componentResult = await client.query(CheckComponentQuery, [component_id]);
        if (componentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Component not found' });
        }

        const UpdateDataQuery = `
            UPDATE odfc.odfc_data
            SET 
                reference_no = $1,
                ofdc_gauge_no = $2,
                remark = $3,
                other_remark = $4,
                gauge_id = $5,
                character_id = $6,
                component_id = $7
            WHERE 
                data_id = $8;
        `;
        await client.query(UpdateDataQuery, [
            reference_no,
            ofdc_gauge_no,
            remark,
            other_remark,
            gauge_id,
            character_id,
            component_id,
            data_id
        ]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Data updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during data update:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
}

async function deleteData(req, res) {
    const { data_id } = req.params;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const CheckDataQuery = `SELECT * FROM odfc.odfc_data WHERE data_id = $1;`;
        const dataResult = await client.query(CheckDataQuery, [data_id]);
        if (dataResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Data not found' });
        }

        const DeleteDataQuery = `DELETE FROM odfc.odfc_data WHERE data_id = $1;`;
        await client.query(DeleteDataQuery, [data_id]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Data deleted successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during data deletion:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
}

module.exports = {
    addEndStore,
    addComponent,
    addGauge,
    addCharacteristic,
    addSensorConfiguration,
    addSensorMapping,
    getEndStoresForOrganization,
    getComponentsForOrganization,
    getGaugesForOrganization,
    getFullGaugeDataForOrganization,
    insertReport,
    getFullReportDataForOrganization,
    getReportDataById,
    /*----------------------------------*/
    // getEndStoreWithComponentsByOrganization,
    // getDataByComponent,
    // getGaugesWithCharacters,
    // insertData,
    // updateData,
    // deleteData
}