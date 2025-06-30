const express = require('express');
const router = express.Router();

module.exports = ({ User }, authenticateUser) => {
    // GET /api/users/:address
    router.get('/:address', authenticateUser, async (req, res) => {
        // req.user is set by authenticateUser, but let's ensure it's up-to-date from DB
        const user = await User.findOne({ address: req.params.address.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });

    // GET /api/users/:address/portfolio
    router.get('/:address/portfolio', async (req, res) => {
        const { address } = req.params;
        const user = await User.findOne({ address: address.toLowerCase() }).populate('properties');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Properties will be populated in the properties route/model in a real app
        res.json({
            address: user.address,
            totalTokens: user.totalTokens,
            portfolioValue: user.portfolioValue,
            properties: user.properties, // now full Property docs
            aavePosition: {
                totalSupplied: user.totalSuppliedToAave,
                totalBorrowed: user.totalBorrowedFromAave,
                healthFactor: user.healthFactor,
                maxBorrowable: Math.floor(user.totalSuppliedToAave * 0.75)
            },
            claimableYield: user.claimableYield
        });
    });

    return router;
}; 