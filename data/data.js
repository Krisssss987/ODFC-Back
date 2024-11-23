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
            c.component_name
        FROM
            odfc.odfc_end_store es
        LEFT JOIN
            odfc.odfc_component c
        ON
            es.end_store_id = c.end_store_id;
    `;

    try {
        const result = await db.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No end-store data found' });
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

            if (row.component_id) {
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


module.exports = {
    getEndStoreWithComponents,
    
}