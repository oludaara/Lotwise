const express = require('express');
const router = express.Router();

module.exports = (mockDB) => {
    // GET /api/crosschain/supported
    router.get('/supported', (req, res) => {
        res.json({
            supportedChains: [
                // Mainnets
                { chainId: 1, name: 'Ethereum', symbol: 'ETH', active: true, network: 'mainnet', ccipSelector: '5009297550715157269' },
                { chainId: 137, name: 'Polygon', symbol: 'MATIC', active: true, network: 'mainnet', ccipSelector: '4051577828743386545' },
                { chainId: 43114, name: 'Avalanche', symbol: 'AVAX', active: true, network: 'mainnet', ccipSelector: '6433500567565415381' },
                // Testnets (Primary focus)
                { chainId: 11155111, name: 'Sepolia', symbol: 'ETH', active: true, network: 'testnet', ccipSelector: '16015286601757825753', primary: true },
                { chainId: 80001, name: 'Mumbai', symbol: 'MATIC', active: true, network: 'testnet', ccipSelector: '12532609583862916517' },
                { chainId: 43113, name: 'Avalanche Fuji', symbol: 'AVAX', active: true, network: 'testnet', ccipSelector: '14767482510784806043' }
            ],
            ccipFeatures: {
                crossChainTransfers: true,
                tokenBridging: true,
                messagePassing: true,
                liquidityPools: true
            },
            recommendedTestnet: {
                chainId: 11155111,
                name: 'Sepolia',
                reason: 'Primary testnet with full Lotwise deployment'
            }
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