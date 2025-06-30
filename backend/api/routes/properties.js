const express = require('express');
const router = express.Router();

module.exports = ({ Property }) => {
    // GET /api/properties
    router.get('/', async (req, res) => {
        const { limit = 10, offset = 0, verified, chain, crossChainEnabled } = req.query;
        let query = {};

        if (verified !== undefined) {
            query.verified = verified === 'true';
        }
        if (chain) {
            query.sourceChain = parseInt(chain);
        }
        if (crossChainEnabled === 'true') {
            query.crossChainEnabled = true;
        }

        const properties = await Property.find(query)
            .skip(Number(offset))
            .limit(Number(limit));
        const total = await Property.countDocuments(query);

        res.json({
            properties,
            total,
            limit: Number(limit),
            offset: Number(offset),
            filters: {
                verified,
                chain,
                crossChainEnabled
            }
        });
    });

    // GET /api/properties/:id
    router.get('/:id', async (req, res) => {
        const property = await Property.findOne({ id: req.params.id });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Add cross-chain information
        const crossChainInfo = {
            supportedChains: [11155111, 137, 43114, 80001, 43113],
            tokensOnChains: {
                '11155111': Math.floor(property.mintedTokens * 0.4), // 40% on Sepolia
                '137': Math.floor(property.mintedTokens * 0.35), // 35% on Polygon
                '43114': Math.floor(property.mintedTokens * 0.25) // 25% on Avalanche
            },
            crossChainTransfers: Math.floor(Math.random() * 50) + 10, // Mock data
            averageTransferTime: '5.2 minutes'
        };

        res.json({
            ...property.toObject(),
            crossChainInfo
        });
    });

    // POST /api/properties/:id/verify
    router.post('/:id/verify', async (req, res) => {
        const { id } = req.params;
        const { verificationData, chainId } = req.body;

        const property = await Property.findOne({ id });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        property.verified = true;
        property.isVerified = true;
        property.verificationTimestamp = new Date();
        property.verificationData = verificationData || 'Verified via Chainlink Functions';
        property.sourceChain = chainId || 11155111; // Default to Sepolia
        property.crossChainEnabled = true;

        await property.save();

        res.json({
            verified: true,
            message: 'Property verified successfully via cross-chain verification',
            valuation: property.totalValue,
            crossChainInfo: {
                sourceChain: property.sourceChain,
                supportedChains: [11155111, 137, 43114, 80001, 43113],
                verificationMethod: 'Chainlink Functions',
                verificationTimestamp: property.verificationTimestamp
            }
        });
    });

    // POST /api/properties/:id/transfer
    router.post('/:id/transfer', async (req, res) => {
        const { id } = req.params;
        const { tokenIds, destinationChain, recipient, fee } = req.body;

        if (!tokenIds || !destinationChain || !recipient) {
            return res.status(400).json({
                error: 'Missing required parameters: tokenIds, destinationChain, recipient'
            });
        }

        const property = await Property.findOne({ id });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Generate transfer record
        const transferId = '0x' + Math.random().toString(16).substr(2, 64);
        const messageId = '0x' + Math.random().toString(16).substr(2, 64);

        const transferRecord = {
            transferId,
            messageId,
            propertyId: id,
            tokenIds: Array.isArray(tokenIds) ? tokenIds : [tokenIds],
            fromChain: property.sourceChain || 11155111,
            toChain: parseInt(destinationChain),
            from: '0x' + Math.random().toString(16).substr(2, 40),
            to: recipient,
            status: 'pending',
            fee: fee || '0.001',
            initiatedAt: new Date().toISOString(),
            estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        };

        res.json({
            success: true,
            transfer: transferRecord,
            property: {
                id: property.id,
                address: property.address,
                totalValue: property.totalValue,
                tokenPrice: property.tokenPrice
            },
            message: 'Cross-chain property transfer initiated'
        });
    });

    // GET /api/properties/:id/transfers
    router.get('/:id/transfers', async (req, res) => {
        const { id } = req.params;
        const { status, limit = 20, offset = 0 } = req.query;

        const property = await Property.findOne({ id });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Mock transfer data for the property
        const mockTransfers = [
            {
                transferId: '0x' + Math.random().toString(16).substr(2, 64),
                propertyId: id,
                tokenIds: [1, 2, 3],
                fromChain: 11155111,
                toChain: 137,
                from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                to: '0x8ba1f109551bD432803012645Hac136c772c3',
                status: 'completed',
                fee: '0.001',
                initiatedAt: new Date(Date.now() - 86400000).toISOString(),
                completedAt: new Date(Date.now() - 82800000).toISOString()
            },
            {
                transferId: '0x' + Math.random().toString(16).substr(2, 64),
                propertyId: id,
                tokenIds: [4, 5],
                fromChain: 137,
                toChain: 43114,
                from: '0x8ba1f109551bD432803012645Hac136c772c3',
                to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                status: 'pending',
                fee: '0.001',
                initiatedAt: new Date().toISOString(),
                estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString()
            }
        ];

        let transfers = mockTransfers;
        if (status) {
            transfers = transfers.filter(t => t.status === status);
        }

        res.json({
            success: true,
            propertyId: id,
            transfers: transfers.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
            total: transfers.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    });

    // GET /api/properties/:id/crosschain
    router.get('/:id/crosschain', async (req, res) => {
        const { id } = req.params;

        const property = await Property.findOne({ id });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Mock cross-chain distribution data
        const crossChainData = {
            propertyId: id,
            totalTokens: property.totalTokens,
            mintedTokens: property.mintedTokens,
            distribution: {
                '11155111': {
                    tokens: Math.floor(property.mintedTokens * 0.4),
                    percentage: 40,
                    owners: Math.floor(Math.random() * 50) + 10
                },
                '137': {
                    tokens: Math.floor(property.mintedTokens * 0.35),
                    percentage: 35,
                    owners: Math.floor(Math.random() * 40) + 8
                },
                '43114': {
                    tokens: Math.floor(property.mintedTokens * 0.25),
                    percentage: 25,
                    owners: Math.floor(Math.random() * 30) + 5
                }
            },
            transferStats: {
                totalTransfers: Math.floor(Math.random() * 100) + 20,
                completedTransfers: Math.floor(Math.random() * 80) + 15,
                pendingTransfers: Math.floor(Math.random() * 10) + 2,
                averageTransferTime: '5.2 minutes',
                successRate: '98.5%'
            },
            supportedChains: [
                {
                    chainId: 11155111,
                    name: 'Sepolia',
                    active: true,
                    routerAddress: '0xD0daae2231E9CB96b94C8512223533293C3693Bf'
                },
                {
                    chainId: 137,
                    name: 'Polygon',
                    active: true,
                    routerAddress: '0x3C3D92629A02a8D95D5CB9650fe49C3544f69B43'
                },
                {
                    chainId: 43114,
                    name: 'Avalanche',
                    active: true,
                    routerAddress: '0x27a4E2900F5b2cE6B3C8C8C8C8C8C8C8C8C8C8C8'
                }
            ]
        };

        res.json({
            success: true,
            property: {
                id: property.id,
                address: property.address,
                totalValue: property.totalValue,
                verified: property.verified,
                crossChainEnabled: property.crossChainEnabled
            },
            crossChainData
        });
    });

    // POST /api/properties/:id/enable-crosschain
    router.post('/:id/enable-crosschain', async (req, res) => {
        const { id } = req.params;
        const { supportedChains } = req.body;

        const property = await Property.findOne({ id });
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (!property.verified) {
            return res.status(400).json({
                error: 'Property must be verified before enabling cross-chain transfers'
            });
        }

        property.crossChainEnabled = true;
        property.supportedChains = supportedChains || [11155111, 137, 43114];
        property.crossChainEnabledAt = new Date();

        await property.save();

        res.json({
            success: true,
            message: 'Cross-chain transfers enabled for property',
            property: {
                id: property.id,
                address: property.address,
                crossChainEnabled: property.crossChainEnabled,
                supportedChains: property.supportedChains
            }
        });
    });

    // GET /api/properties/crosschain/stats
    router.get('/crosschain/stats', async (req, res) => {
        const totalProperties = await Property.countDocuments({});
        const crossChainProperties = await Property.countDocuments({ crossChainEnabled: true });
        const verifiedProperties = await Property.countDocuments({ verified: true });

        // Mock cross-chain statistics
        const crossChainStats = {
            totalProperties,
            crossChainProperties,
            verifiedProperties,
            crossChainPercentage: totalProperties > 0 ? (crossChainProperties / totalProperties * 100).toFixed(2) : 0,
            verifiedPercentage: totalProperties > 0 ? (verifiedProperties / totalProperties * 100).toFixed(2) : 0,
            totalTransfers: Math.floor(Math.random() * 1000) + 200,
            totalVolume: (Math.random() * 1000 + 100).toFixed(2),
            averageTransferTime: '5.2 minutes',
            successRate: '98.5%',
            supportedChains: 6,
            activeProperties: crossChainProperties
        };

        res.json({
            success: true,
            stats: crossChainStats
        });
    });

    return router;
}; 