const bcrypt = require('bcrypt');
const db = require('../db');
const jwtUtils = require('../token/jwtUtils');
const { v4: uuidv4 } = require('uuid');

async function getEndStoreWithComponents(req, res) {
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
            c.component_name,
            g.gauge_id,
            g.gauge_type
        FROM
            odfc.odfc_end_store es
        LEFT JOIN
            odfc.odfc_component c
        ON
            es.end_store_id = c.end_store_id
        LEFT JOIN
            odfc.odfc_gauge g
        ON
            es.end_store_id = g.end_store_id;
    `;

    try {
        const result = await db.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No end-store data found' });
        }

        // Step 1: Initialize a map to store data by end_store_id
        const endStoreMap = new Map();

        result.rows.forEach(row => {
            // If this end store_id hasn't been added yet, initialize the data
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
                    gauge: [],
                });
            }

            // Add component if it exists and isn't already added for this end store
            if (row.component_id && !endStoreMap.get(row.end_store_id).component.some(c => c.component_id === row.component_id)) {
                endStoreMap.get(row.end_store_id).component.push({
                    component_id: row.component_id,
                    component_name: row.component_name,
                });
            }

            // Add gauge if it exists and isn't already added for this end store
            if (row.gauge_id && !endStoreMap.get(row.end_store_id).gauge.some(g => g.gauge_id === row.gauge_id)) {
                endStoreMap.get(row.end_store_id).gauge.push({
                    gauge_id: row.gauge_id,
                    gauge_type: row.gauge_type,
                });
            }
        });

        // Convert the Map to an array for the response
        const responseData = Array.from(endStoreMap.values());

        res.status(200).json(responseData);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getGaugeDataByComponent(req, res) {
    const { component_id } = req.params;

    const query = `
        SELECT * 
        FROM odfc.odfc_gauge 
        WHERE component_id = $1;
    `;

    try {
        const result = await db.query(query, [component_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No gauges found for the given component ID' });
        }
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getEndStoreWithComponents,
    getGaugeDataByComponent,    
}