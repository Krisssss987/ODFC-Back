const bcrypt = require('bcrypt');
const db = require('../db');
const jwtUtils = require('../token/jwtUtils');
const { v4: uuidv4 } = require('uuid');

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
    getEndStoreWithComponentsByOrganization,
    getDataByComponent, 
    getGaugesWithCharacters,
    insertData,
    updateData,
    deleteData  
}