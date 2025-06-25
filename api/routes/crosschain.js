const express = require('express');
const router = express.Router();

module.exports = (mockDB) => {
    // GET /api/crosschain/supported
    router.get('/supported', (req, res) => {
        res.json({
            supportedChains: [
                { chainId: 1, name: 'Ethereum', symbol: 'ETH', active: true },
                { chainId: 137, name: 'Polygon', symbol: 'MATIC', active: true },
                { chainId: 11155111, name: 'Sepolia', symbol: 'ETH', active: true },
                { chainId: 80001, name: 'Mumbai', symbol: 'MATIC', active: true }
            ]
        });
    });

    // POST /api/crosschain/transfer
    router.post('/transfer', (req, res) => {
        const { tokenId, fromChain, toChain, recipient } = req.body;
        res.json({
            success: true,
            transferId: '0x' + Math.random().toString(16).substr(2, 64),
            tokenId: tokenId,
            fromChain: fromChain,
            toChain: toChain,
            recipient: recipient,
            estimatedTime: '5-10 minutes',
            message: 'Cross-chain transfer initiated'
        });
    });

    return router;
}; 