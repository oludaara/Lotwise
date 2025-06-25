const express = require('express');
const router = express.Router();

module.exports = (mockDB) => {
    // GET /api/crosschain/supported
    router.get('/supported', (req, res) => {
        res.json({
            supportedChains: [
                { chainId: 1, name: 'Ethereum', symbol: 'ETH', active: true, network: 'mainnet' },
                { chainId: 137, name: 'Polygon', symbol: 'MATIC', active: true, network: 'mainnet' },
                { chainId: 43114, name: 'Avalanche', symbol: 'AVAX', active: true, network: 'mainnet' },
                { chainId: 11155111, name: 'Sepolia', symbol: 'ETH', active: true, network: 'testnet' },
                { chainId: 80001, name: 'Mumbai', symbol: 'MATIC', active: true, network: 'testnet' },
                { chainId: 43113, name: 'Avalanche Fuji', symbol: 'AVAX', active: true, network: 'testnet' }
            ],
            ccipSupported: [
                { chainId: 1, selector: '5009297550715157269' },
                { chainId: 137, selector: '4051577828743386545' },
                { chainId: 43114, selector: '6433500567565415381' },
                { chainId: 43113, selector: '14767482510784806043' }
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