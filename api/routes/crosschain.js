const express = require('express');
const router = express.Router();

module.exports = (mockDB) => {
    // GET /api/crosschain/supported
    router.get('/supported', (req, res) => {
        res.json({
            supportedChains: [
                {
                    chainId: 1,
                    name: 'Ethereum',
                    symbol: 'ETH',
                    active: true,
                    routerAddress: '0xE561d5E02207fb5eB32cca20a699E0d8919a1476',
                    ccipEnabled: true,
                    network: 'mainnet',
                    ccipSelector: '5009297550715157269'
                },
                {
                    chainId: 137,
                    name: 'Polygon',
                    symbol: 'MATIC',
                    active: true,
                    routerAddress: '0x3C3D92629A02a8D95D5CB9650fe49C3544f69B43',
                    ccipEnabled: true,
                    network: 'mainnet',
                    ccipSelector: '4051577828743386545'
                },
                {
                    chainId: 43114,
                    name: 'Avalanche',
                    symbol: 'AVAX',
                    active: true,
                    routerAddress: '0x27a4E2900F5b2cE6B3C8C8C8C8C8C8C8C8C8C8C8',
                    ccipEnabled: true,
                    network: 'mainnet',
                    ccipSelector: '6433500567565415381'
                },
                {
                    chainId: 11155111,
                    name: 'Sepolia',
                    symbol: 'ETH',
                    active: true,
                    routerAddress: '0xD0daae2231E9CB96b94C8512223533293C3693Bf',
                    ccipEnabled: true,
                    network: 'testnet',
                    ccipSelector: '16015286601757825753',
                    primary: true
                },
                {
                    chainId: 80001,
                    name: 'Mumbai',
                    symbol: 'MATIC',
                    active: true,
                    routerAddress: '0x70499c328e1E2a3c4d6fC7C8C8C8C8C8C8C8C8C8',
                    ccipEnabled: true,
                    network: 'testnet',
                    ccipSelector: '12532609583862916517'
                },
                {
                    chainId: 43113,
                    name: 'Fuji',
                    symbol: 'AVAX',
                    active: true,
                    routerAddress: '0x8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8',
                    ccipEnabled: true,
                    network: 'testnet',
                    ccipSelector: '14767482510784806043'
                }
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

    // GET /api/crosschain/fee
    router.get('/fee', (req, res) => {
        const { tokenId, destinationChain, recipient } = req.query;

        if (!tokenId || !destinationChain || !recipient) {
            return res.status(400).json({
                error: 'Missing required parameters: tokenId, destinationChain, recipient'
            });
        }

        // Mock fee calculation based on destination chain
        const feeMap = {
            '1': '0.001',      // Ethereum: 0.001 ETH
            '137': '0.01',     // Polygon: 0.01 MATIC
            '11155111': '0.0001', // Sepolia: 0.0001 ETH
            '80001': '0.001',   // Mumbai: 0.001 MATIC
            '43114': '0.001',   // Avalanche: 0.001 AVAX
            '43113': '0.001'    // Fuji: 0.001 AVAX
        };

        const estimatedFee = feeMap[destinationChain] || '0.001';
        const estimatedTime = '5-10 minutes';

        res.json({
            success: true,
            tokenId: parseInt(tokenId),
            destinationChain: parseInt(destinationChain),
            recipient: recipient,
            estimatedFee: estimatedFee,
            estimatedTime: estimatedTime,
            feeCurrency: destinationChain === '137' || destinationChain === '80001' || destinationChain === '43114' || destinationChain === '43113' ? 'MATIC' : 'ETH'
        });
    });

    // POST /api/crosschain/transfer
    router.post('/transfer', (req, res) => {
        const { tokenId, destinationChain, recipient, fee } = req.body;

        if (!tokenId || !destinationChain || !recipient) {
            return res.status(400).json({
                error: 'Missing required parameters: tokenId, destinationChain, recipient'
            });
        }

        // Validate parameters
        const supportedChains = [1, 137, 11155111, 80001, 43114, 43113];
        if (!supportedChains.includes(parseInt(destinationChain))) {
            return res.status(400).json({
                error: 'Unsupported destination chain'
            });
        }

        // Generate unique transfer ID
        const transferId = '0x' + Math.random().toString(16).substr(2, 64);
        const messageId = '0x' + Math.random().toString(16).substr(2, 64);

        // Store transfer record in mock DB
        const transferRecord = {
            transferId: transferId,
            messageId: messageId,
            tokenId: parseInt(tokenId),
            fromChain: 11155111, // Assuming Sepolia as source
            toChain: parseInt(destinationChain),
            from: '0x' + Math.random().toString(16).substr(2, 40),
            to: recipient,
            status: 'pending',
            fee: fee || '0.001',
            initiatedAt: new Date().toISOString(),
            estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        };

        mockDB.crossChainTransfers = mockDB.crossChainTransfers || [];
        mockDB.crossChainTransfers.push(transferRecord);

        res.json({
            success: true,
            transferId: transferId,
            messageId: messageId,
            tokenId: parseInt(tokenId),
            fromChain: 11155111,
            toChain: parseInt(destinationChain),
            from: transferRecord.from,
            to: recipient,
            fee: transferRecord.fee,
            status: 'pending',
            estimatedTime: '5-10 minutes',
            message: 'Cross-chain transfer initiated via Chainlink CCIP'
        });
    });

    // GET /api/crosschain/transfer/:transferId
    router.get('/transfer/:transferId', (req, res) => {
        const { transferId } = req.params;

        mockDB.crossChainTransfers = mockDB.crossChainTransfers || [];
        const transfer = mockDB.crossChainTransfers.find(t => t.transferId === transferId);

        if (!transfer) {
            return res.status(404).json({
                error: 'Transfer not found'
            });
        }

        // Simulate transfer completion after some time
        const initiatedTime = new Date(transfer.initiatedAt).getTime();
        const currentTime = Date.now();
        const timeElapsed = currentTime - initiatedTime;

        if (timeElapsed > 8 * 60 * 1000 && transfer.status === 'pending') { // 8 minutes
            transfer.status = 'completed';
            transfer.completedAt = new Date().toISOString();
        }

        res.json({
            success: true,
            transfer: transfer
        });
    });

    // GET /api/crosschain/transfers
    router.get('/transfers', (req, res) => {
        const { status, chain } = req.query;

        mockDB.crossChainTransfers = mockDB.crossChainTransfers || [];
        let transfers = mockDB.crossChainTransfers;

        // Filter by status if provided
        if (status) {
            transfers = transfers.filter(t => t.status === status);
        }

        // Filter by chain if provided
        if (chain) {
            transfers = transfers.filter(t =>
                t.fromChain === parseInt(chain) || t.toChain === parseInt(chain)
            );
        }

        res.json({
            success: true,
            transfers: transfers,
            total: transfers.length
        });
    });

    // POST /api/crosschain/estimate-gas
    router.post('/estimate-gas', (req, res) => {
        const { tokenId, destinationChain, recipient } = req.body;

        if (!tokenId || !destinationChain || !recipient) {
            return res.status(400).json({
                error: 'Missing required parameters: tokenId, destinationChain, recipient'
            });
        }

        // Mock gas estimation
        const gasEstimates = {
            '1': { gasLimit: 200000, gasPrice: '20000000000' },      // Ethereum
            '137': { gasLimit: 300000, gasPrice: '30000000000' },    // Polygon
            '11155111': { gasLimit: 150000, gasPrice: '15000000000' }, // Sepolia
            '80001': { gasLimit: 250000, gasPrice: '25000000000' },   // Mumbai
            '43114': { gasLimit: 200000, gasPrice: '20000000000' },   // Avalanche
            '43113': { gasLimit: 200000, gasPrice: '20000000000' }    // Fuji
        };

        const estimate = gasEstimates[destinationChain] || gasEstimates['11155111'];
        const estimatedCost = (BigInt(estimate.gasLimit) * BigInt(estimate.gasPrice)) / BigInt(1e18);

        res.json({
            success: true,
            tokenId: parseInt(tokenId),
            destinationChain: parseInt(destinationChain),
            recipient: recipient,
            gasEstimate: estimate,
            estimatedCost: estimatedCost.toString(),
            currency: destinationChain === '137' || destinationChain === '80001' || destinationChain === '43114' || destinationChain === '43113' ? 'MATIC' : 'ETH'
        });
    });

    return router;
}; 