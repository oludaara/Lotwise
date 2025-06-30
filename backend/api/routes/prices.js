const express = require('express');
const router = express.Router();

module.exports = ({ PriceHistory }) => {
    // GET /api/prices/current
    router.get('/current', async (req, res) => {
        const latest = await PriceHistory.findOne({}, {}, { sort: { timestamp: -1 } });
        if (!latest) {
            return res.status(404).json({ error: 'No price data found' });
        }
        res.json({
            timestamp: new Date().toISOString(),
            ethPrice: latest.ethPrice,
            maticPrice: latest.maticPrice,
            source: 'Chainlink Price Feeds'
        });
    });

    // GET /api/prices/history
    router.get('/history', async (req, res) => {
        const { days = 7 } = req.query;
        const history = await PriceHistory.find({})
            .sort({ timestamp: -1 })
            .limit(Number(days));
        res.json({
            history: history.reverse(),
            period: `${days} days`
        });
    });

    return router;
}; 