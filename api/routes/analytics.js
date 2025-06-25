const express = require('express');
const router = express.Router();

module.exports = ({ Property, Marketplace }) => {
    // GET /api/analytics/platform
    router.get('/platform', async (req, res) => {
        const properties = await Property.find({});
        const marketplace = await Marketplace.find({ active: true });
        res.json({
            totalProperties: properties.length,
            totalTokens: properties.reduce((sum, p) => sum + (p.mintedTokens || 0), 0),
            totalValue: properties.reduce((sum, p) => sum + (p.totalValue || 0), 0),
            totalSuppliedToAave: properties.reduce((sum, p) => sum + ((p.aaveStats && p.aaveStats.totalSupplied) || 0), 0),
            totalBorrowedFromAave: properties.reduce((sum, p) => sum + ((p.aaveStats && p.aaveStats.totalBorrowed) || 0), 0),
            totalYieldDistributed: properties.reduce((sum, p) => sum + ((p.aaveStats && p.aaveStats.totalYieldDistributed) || 0), 0),
            averageAPY: properties.length ? (properties.reduce((sum, p) => sum + ((p.aaveStats && p.aaveStats.averageAPY) || 0), 0) / properties.length) : 0,
            activeListings: marketplace.length
        });
    });
    return router;
}; 