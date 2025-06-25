const express = require('express');
const router = express.Router();

module.exports = ({ User }) => {
    // GET /api/liquidation/risks
    router.get('/risks', async (req, res) => {
        // Example: Find users with healthFactor < 80 (at risk)
        const atRiskUsers = await User.find({ healthFactor: { $lt: 80 } }).populate('properties');
        res.json({
            atRiskPositions: atRiskUsers.map(u => ({
                address: u.address,
                healthFactor: u.healthFactor,
                collateralValue: u.totalSuppliedToAave,
                borrowedAmount: u.totalBorrowedFromAave,
                liquidationThreshold: u.totalSuppliedToAave * 0.8,
                timeToLiquidation: 'unknown', // Would require more logic
                properties: u.properties // full Property docs
            })),
            totalAtRisk: atRiskUsers.length,
            averageHealthFactor: atRiskUsers.length ? (atRiskUsers.reduce((sum, u) => sum + u.healthFactor, 0) / atRiskUsers.length) : 0
        });
    });
    return router;
}; 