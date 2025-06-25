const express = require('express');
const router = express.Router();

module.exports = ({ Property }) => {
    // GET /api/properties
    router.get('/', async (req, res) => {
        const { limit = 10, offset = 0, verified } = req.query;
        let query = {};
        if (verified !== undefined) {
            query.verified = verified === 'true';
        }
        const properties = await Property.find(query)
            .skip(Number(offset))
            .limit(Number(limit));
        const total = await Property.countDocuments(query);
        res.json({
            properties,
            total,
            limit: Number(limit),
            offset: Number(offset)
        });
    });

    // GET /api/properties/:id
    router.get('/:id', async (req, res) => {
        const property = await Property.findOne({ id: req.params.id });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        res.json(property);
    });

    // POST /api/properties/:id/verify
    router.post('/:id/verify', async (req, res) => {
        const { id } = req.params;
        const property = await Property.findOne({ id });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        property.verified = true;
        await property.save();
        res.json({
            verified: true,
            message: 'Property verified successfully',
            valuation: property.totalValue
        });
    });

    return router;
}; 