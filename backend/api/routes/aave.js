const express = require('express');
const router = express.Router();

module.exports = ({ User }) => {
    // GET /api/aave/position/:address
    router.get('/position/:address', async (req, res) => {
        const { address } = req.params;
        const user = await User.findOne({ address: address.toLowerCase() }).populate('properties');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            address: user.address,
            suppliedAmount: user.totalSuppliedToAave,
            borrowedAmount: user.totalBorrowedFromAave,
            healthFactor: user.healthFactor,
            maxBorrowable: Math.floor(user.totalSuppliedToAave * 0.75),
            liquidationThreshold: user.totalSuppliedToAave * 0.8,
            isCollateralized: user.totalSuppliedToAave > 0,
            currentAPY: 5.2,
            properties: user.properties
        });
    });

    // POST /api/aave/supply
    router.post('/supply', async (req, res) => {
        // This is a mock implementation; in a real app, update user and property models
        res.json({
            success: true,
            transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
            suppliedAmount: req.body.amount,
            newHealthFactor: 95,
            message: 'Tokens supplied as collateral successfully'
        });
    });

    // POST /api/aave/borrow
    router.post('/borrow', async (req, res) => {
        // This is a mock implementation; in a real app, update user and property models
        res.json({
            success: true,
            transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
            borrowedAmount: req.body.amount,
            asset: req.body.asset,
            newHealthFactor: 82,
            message: 'Assets borrowed successfully'
        });
    });

    // POST /api/aave/repay
    router.post('/repay', async (req, res) => {
        // This is a mock implementation; in a real app, update user and property models
        res.json({
            success: true,
            transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
            repaidAmount: req.body.amount,
            asset: req.body.asset,
            newHealthFactor: 92,
            message: 'Loan repaid successfully'
        });
    });

    return router;
}; 