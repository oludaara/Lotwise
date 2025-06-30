const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');

module.exports = (mockDB) => {
    // Validation middleware
    const handleValidationErrors = (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        next();
    };

    // GET /api/crosschain/supported
    router.get('/supported', (req, res) => {
        res.json({
            success: true,
            supportedChains: [
                {
                    chainId: 1,
                    name: 'Ethereum',
                    symbol: 'ETH',
                    active: true,
                    routerAddress: '0xE561d5E02207fb5eB32cca20a699E0d8919a1476',
                    ccipEnabled: true,
                    network: 'mainnet',
                    ccipSelector: '5009297550715157269',
                    gasToken: 'ETH',
                    estimatedGas: '200000',
                    averageTransferTime: '5-10 minutes',
                    baseFee: '0.001'
                },
                {
                    chainId: 137,
                    name: 'Polygon',
                    symbol: 'MATIC',
                    active: true,
                    routerAddress: '0x3C3D92629A02a8D95D5CB9650fe49C3544f69B43',
                    ccipEnabled: true,
                    network: 'mainnet',
                    ccipSelector: '4051577828743386545',
                    gasToken: 'MATIC',
                    estimatedGas: '300000',
                    averageTransferTime: '2-5 minutes',
                    baseFee: '0.01'
                },
                {
                    chainId: 43114,
                    name: 'Avalanche',
                    symbol: 'AVAX',
                    active: true,
                    routerAddress: '0x27a4E2900F5b2cE6B3C8C8C8C8C8C8C8C8C8C8C8',
                    ccipEnabled: true,
                    network: 'mainnet',
                    ccipSelector: '6433500567565415381',
                    gasToken: 'AVAX',
                    estimatedGas: '200000',
                    averageTransferTime: '5-10 minutes',
                    baseFee: '0.001'
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
                    gasToken: 'ETH',
                    estimatedGas: '150000',
                    averageTransferTime: '5-10 minutes',
                    baseFee: '0.0001',
                    primary: true
                },
                {
                    chainId: 80001,
                    name: 'Mumbai',
                    symbol: 'MATIC',
                    active: true,
                    routerAddress: '0x70499c328e1E2a3c4d6fC7C8C8C8C8C8C8C8C8C8C8',
                    ccipEnabled: true,
                    network: 'testnet',
                    ccipSelector: '12532609583862916517',
                    gasToken: 'MATIC',
                    estimatedGas: '250000',
                    averageTransferTime: '2-5 minutes',
                    baseFee: '0.001'
                },
                {
                    chainId: 43113,
                    name: 'Fuji',
                    symbol: 'AVAX',
                    active: true,
                    routerAddress: '0x8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8',
                    ccipEnabled: true,
                    network: 'testnet',
                    ccipSelector: '14767482510784806043',
                    gasToken: 'AVAX',
                    estimatedGas: '200000',
                    averageTransferTime: '5-10 minutes',
                    baseFee: '0.001'
                }
            ],
            ccipFeatures: {
                crossChainTransfers: true,
                tokenBridging: true,
                messagePassing: true,
                liquidityPools: true,
                marketplaceCrossChain: true,
                yieldCrossChain: true,
                batchTransfers: false,
                instantTransfers: false
            },
            recommendedTestnet: {
                chainId: 11155111,
                name: 'Sepolia',
                reason: 'Primary testnet with full Lotwise deployment'
            },
            transferLimits: {
                maxTokensPerTransfer: 10,
                maxValuePerTransfer: '10000000000000000000000', // 10 ETH
                minTransferFee: '100000000000000000' // 0.1 ETH
            },
            gasEstimates: {
                baseGasLimit: 200000,
                tokenMultiplier: 50000,
                maxGasLimit: 500000
            }
        });
    });

    // GET /api/crosschain/fee
    router.get('/fee', [
        query('tokenId').isInt({ min: 1 }).withMessage('Token ID must be a positive integer'),
        query('destinationChain').isInt({ min: 1 }).withMessage('Destination chain must be a positive integer'),
        query('recipient').isEthereumAddress().withMessage('Recipient must be a valid Ethereum address'),
        query('tokenCount').optional().isInt({ min: 1, max: 10 }).withMessage('Token count must be between 1 and 10'),
        handleValidationErrors
    ], (req, res) => {
        const { tokenId, destinationChain, recipient, tokenCount = 1 } = req.query;

        // Enhanced fee calculation based on destination chain and token count
        const feeMap = {
            '1': { baseFee: '0.001', gasMultiplier: 1.2, timeEstimate: '5-10 minutes' },
            '137': { baseFee: '0.01', gasMultiplier: 1.1, timeEstimate: '2-5 minutes' },
            '11155111': { baseFee: '0.0001', gasMultiplier: 1.0, timeEstimate: '5-10 minutes' },
            '80001': { baseFee: '0.001', gasMultiplier: 1.1, timeEstimate: '2-5 minutes' },
            '43114': { baseFee: '0.001', gasMultiplier: 1.0, timeEstimate: '5-10 minutes' },
            '43113': { baseFee: '0.001', gasMultiplier: 1.0, timeEstimate: '5-10 minutes' }
        };

        const feeConfig = feeMap[destinationChain] || feeMap['11155111'];
        const baseFee = parseFloat(feeConfig.baseFee);
        const tokenCountNum = parseInt(tokenCount);
        
        // Calculate fee based on token count (more tokens = higher fee)
        const estimatedFee = (baseFee * feeConfig.gasMultiplier * Math.max(1, tokenCountNum / 5)).toFixed(6);
        const estimatedTime = feeConfig.timeEstimate;

        // Calculate gas estimates
        const baseGasLimit = 200000;
        const adjustedGasLimit = Math.min(
            baseGasLimit * Math.max(1, tokenCountNum / 5),
            500000 // Max gas limit
        );

        res.json({
            success: true,
            tokenId: parseInt(tokenId),
            tokenCount: tokenCountNum,
            destinationChain: parseInt(destinationChain),
            recipient: recipient,
            estimatedFee: estimatedFee,
            estimatedTime: estimatedTime,
            feeCurrency: destinationChain === '137' || destinationChain === '80001' || destinationChain === '43114' || destinationChain === '43113' ? 'MATIC' : 'ETH',
            gasEstimate: {
                gasLimit: adjustedGasLimit,
                gasPrice: '20000000000',
                estimatedGasCost: (adjustedGasLimit * 20000000000 / 1e18).toFixed(6)
            },
            breakdown: {
                baseFee: feeConfig.baseFee,
                gasMultiplier: feeConfig.gasMultiplier,
                tokenCountMultiplier: Math.max(1, tokenCountNum / 5),
                totalMultiplier: (feeConfig.gasMultiplier * Math.max(1, tokenCountNum / 5)).toFixed(2)
            },
            recommendations: {
                optimalTime: destinationChain === '137' || destinationChain === '80001' ? 'Low traffic hours' : 'Any time',
                costSavings: tokenCountNum > 1 ? 'Consider batch transfer for multiple tokens' : null
            }
        });
    });

    // POST /api/crosschain/transfer
    router.post('/transfer', [
        body('tokenId').isInt({ min: 1 }).withMessage('Token ID must be a positive integer'),
        body('destinationChain').isInt({ min: 1 }).withMessage('Destination chain must be a positive integer'),
        body('recipient').isEthereumAddress().withMessage('Recipient must be a valid Ethereum address'),
        body('tokenCount').optional().isInt({ min: 1, max: 10 }).withMessage('Token count must be between 1 and 10'),
        body('propertyId').optional().isString().withMessage('Property ID must be a string'),
        body('fee').optional().isFloat({ min: 0 }).withMessage('Fee must be a positive number'),
        body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('Priority must be low, normal, or high'),
        handleValidationErrors
    ], (req, res) => {
        const { 
            tokenId, 
            destinationChain, 
            recipient, 
            fee, 
            tokenCount = 1, 
            propertyId,
            priority = 'normal',
            autoRetry = true,
            notifications = true
        } = req.body;

        // Validate parameters
        const supportedChains = [1, 137, 11155111, 80001, 43114, 43113];
        if (!supportedChains.includes(parseInt(destinationChain))) {
            return res.status(400).json({
                error: 'Unsupported destination chain',
                supportedChains: supportedChains
            });
        }

        // Generate unique transfer ID
        const transferId = '0x' + Math.random().toString(16).substr(2, 64);
        const messageId = '0x' + Math.random().toString(16).substr(2, 64);

        // Calculate estimated completion time based on destination
        const completionTime = destinationChain === '137' || destinationChain === '80001' 
            ? Date.now() + 5 * 60 * 1000  // 5 minutes for Polygon
            : Date.now() + 10 * 60 * 1000; // 10 minutes for others

        // Store transfer record in mock DB
        const transferRecord = {
            transferId: transferId,
            messageId: messageId,
            tokenId: parseInt(tokenId),
            tokenCount: parseInt(tokenCount),
            propertyId: propertyId || null,
            fromChain: 11155111, // Assuming Sepolia as source
            toChain: parseInt(destinationChain),
            from: '0x' + Math.random().toString(16).substr(2, 40),
            to: recipient,
            status: 'pending',
            fee: fee || '0.001',
            priority: priority,
            initiatedAt: new Date().toISOString(),
            estimatedCompletion: new Date(completionTime).toISOString(),
            transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
            gasUsed: '150000',
            gasPrice: '20000000000',
            userPreferences: {
                autoRetry: autoRetry,
                notifications: notifications
            },
            retryCount: 0,
            maxRetries: 3
        };

        mockDB.crossChainTransfers = mockDB.crossChainTransfers || [];
        mockDB.crossChainTransfers.push(transferRecord);

        res.json({
            success: true,
            transferId: transferId,
            messageId: messageId,
            tokenId: parseInt(tokenId),
            tokenCount: parseInt(tokenCount),
            propertyId: propertyId,
            fromChain: 11155111,
            toChain: parseInt(destinationChain),
            from: transferRecord.from,
            to: recipient,
            fee: transferRecord.fee,
            status: 'pending',
            estimatedTime: destinationChain === '137' || destinationChain === '80001' ? '2-5 minutes' : '5-10 minutes',
            transactionHash: transferRecord.transactionHash,
            priority: priority,
            message: 'Cross-chain transfer initiated via Chainlink CCIP',
            nextSteps: [
                'Monitor transfer status using the transfer ID',
                'Transfer will be completed automatically',
                'You will receive notification upon completion'
            ]
        });
    });

    // GET /api/crosschain/transfer/:transferId
    router.get('/transfer/:transferId', [
        param('transferId').isHexadecimal().withMessage('Transfer ID must be a valid hexadecimal'),
        handleValidationErrors
    ], (req, res) => {
        const { transferId } = req.params;

        mockDB.crossChainTransfers = mockDB.crossChainTransfers || [];
        const transfer = mockDB.crossChainTransfers.find(t => t.transferId === transferId);

        if (!transfer) {
            return res.status(404).json({
                error: 'Transfer not found',
                transferId: transferId
            });
        }

        // Simulate transfer completion after some time
        const initiatedTime = new Date(transfer.initiatedAt).getTime();
        const currentTime = Date.now();
        const timeElapsed = currentTime - initiatedTime;

        // Different completion times based on destination chain
        const completionThreshold = transfer.toChain === 137 || transfer.toChain === 80001 
            ? 3 * 60 * 1000  // 3 minutes for Polygon
            : 8 * 60 * 1000; // 8 minutes for others

        if (timeElapsed > completionThreshold && transfer.status === 'pending') {
            transfer.status = 'completed';
            transfer.completedAt = new Date().toISOString();
            transfer.blockNumber = Math.floor(Math.random() * 1000000) + 1000000;
        }

        // Calculate duration if completed
        const duration = transfer.completedAt 
            ? new Date(transfer.completedAt).getTime() - initiatedTime
            : null;

        res.json({
            success: true,
            transfer: {
                ...transfer,
                duration: duration ? `${Math.floor(duration / 1000)} seconds` : null,
                isOverdue: transfer.status === 'pending' && timeElapsed > completionThreshold * 1.5,
                canRetry: transfer.status === 'failed' && transfer.retryCount < transfer.maxRetries
            }
        });
    });

    // GET /api/crosschain/transfers
    router.get('/transfers', [
        query('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
        query('chain').optional().isInt({ min: 1 }).withMessage('Chain must be a positive integer'),
        query('address').optional().isEthereumAddress().withMessage('Address must be a valid Ethereum address'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
        handleValidationErrors
    ], (req, res) => {
        const { status, chain, address, limit = 20, offset = 0 } = req.query;

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

        // Filter by address if provided
        if (address) {
            transfers = transfers.filter(t =>
                t.from.toLowerCase() === address.toLowerCase() || 
                t.to.toLowerCase() === address.toLowerCase()
            );
        }

        // Apply pagination
        const total = transfers.length;
        transfers = transfers.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        // Calculate statistics
        const stats = {
            total: total,
            pending: mockDB.crossChainTransfers.filter(t => t.status === 'pending').length,
            completed: mockDB.crossChainTransfers.filter(t => t.status === 'completed').length,
            failed: mockDB.crossChainTransfers.filter(t => t.status === 'failed').length,
            successRate: total > 0 ? (mockDB.crossChainTransfers.filter(t => t.status === 'completed').length / total * 100).toFixed(2) : 0
        };

        res.json({
            success: true,
            transfers: transfers,
            pagination: {
                total: total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < total
            },
            stats: stats
        });
    });

    // POST /api/crosschain/estimate-gas
    router.post('/estimate-gas', [
        body('tokenId').isInt({ min: 1 }).withMessage('Token ID must be a positive integer'),
        body('destinationChain').isInt({ min: 1 }).withMessage('Destination chain must be a positive integer'),
        body('recipient').isEthereumAddress().withMessage('Recipient must be a valid Ethereum address'),
        body('tokenCount').optional().isInt({ min: 1, max: 10 }).withMessage('Token count must be between 1 and 10'),
        handleValidationErrors
    ], (req, res) => {
        const { tokenId, destinationChain, recipient, tokenCount = 1 } = req.body;

        // Enhanced gas estimation
        const gasEstimates = {
            '1': { gasLimit: 200000, gasPrice: '20000000000', baseFee: '0.001' },
            '137': { gasLimit: 300000, gasPrice: '30000000000', baseFee: '0.01' },
            '11155111': { gasLimit: 150000, gasPrice: '15000000000', baseFee: '0.0001' },
            '80001': { gasLimit: 250000, gasPrice: '25000000000', baseFee: '0.001' },
            '43114': { gasLimit: 200000, gasPrice: '20000000000', baseFee: '0.001' },
            '43113': { gasLimit: 200000, gasPrice: '20000000000', baseFee: '0.001' }
        };

        const estimate = gasEstimates[destinationChain] || gasEstimates['11155111'];
        const tokenCountNum = parseInt(tokenCount);
        
        // Adjust gas limit based on token count
        const adjustedGasLimit = Math.min(
            estimate.gasLimit * Math.max(1, tokenCountNum / 5),
            500000 // Max gas limit
        );
        
        const estimatedCost = (BigInt(adjustedGasLimit) * BigInt(estimate.gasPrice)) / BigInt(1e18);

        res.json({
            success: true,
            tokenId: parseInt(tokenId),
            tokenCount: tokenCountNum,
            destinationChain: parseInt(destinationChain),
            recipient: recipient,
            gasEstimate: {
                gasLimit: adjustedGasLimit,
                gasPrice: estimate.gasPrice,
                baseFee: estimate.baseFee,
                estimatedCost: estimatedCost.toString()
            },
            currency: destinationChain === '137' || destinationChain === '80001' || destinationChain === '43114' || destinationChain === '43113' ? 'MATIC' : 'ETH',
            breakdown: {
                baseGasLimit: estimate.gasLimit,
                tokenCountMultiplier: Math.max(1, tokenCountNum / 5),
                adjustedGasLimit: adjustedGasLimit,
                costInUSD: (parseFloat(estimatedCost.toString()) * 2000).toFixed(2) // Assuming $2000/ETH
            },
            recommendations: {
                optimalGasPrice: estimate.gasPrice,
                maxGasLimit: 500000,
                costOptimization: tokenCountNum > 1 ? 'Consider batch transfer to reduce gas costs' : null
            }
        });
    });

    // GET /api/crosschain/marketplace/:chainId
    router.get('/marketplace/:chainId', [
        param('chainId').isInt({ min: 1 }).withMessage('Chain ID must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
        handleValidationErrors
    ], (req, res) => {
        const { chainId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        // Mock cross-chain marketplace data
        const mockListings = [
            {
                id: 1,
                tokenId: 123,
                propertyId: 'PROP001',
                price: '1000000000000000000000', // 1000 USD
                seller: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                sourceChain: parseInt(chainId),
                destinationChain: 11155111,
                listedAt: new Date().toISOString(),
                active: true,
                crossChainEnabled: true,
                transferFee: '0.001',
                estimatedTransferTime: '5-10 minutes',
                property: {
                    id: 'PROP001',
                    address: '123 Main St, New York, NY',
                    totalValue: '1000000000000000000000000', // 1M USD
                    tokenPrice: '1000000000000000000000', // 1000 USD
                    description: 'Luxury apartment in Manhattan',
                    imageUrl: '/images/luxury-apartment.jpg',
                    verified: true
                }
            },
            {
                id: 2,
                tokenId: 456,
                propertyId: 'PROP002',
                price: '1500000000000000000000', // 1500 USD
                seller: '0x8ba1f109551bD432803012645Hac136c772c3',
                sourceChain: parseInt(chainId),
                destinationChain: 137,
                listedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                active: true,
                crossChainEnabled: true,
                transferFee: '0.01',
                estimatedTransferTime: '2-5 minutes',
                property: {
                    id: 'PROP002',
                    address: '456 Oak Ave, Los Angeles, CA',
                    totalValue: '1500000000000000000000000', // 1.5M USD
                    tokenPrice: '1500000000000000000000', // 1500 USD
                    description: 'Modern townhouse in Beverly Hills',
                    imageUrl: '/images/modern-townhouse.jpg',
                    verified: true
                }
            }
        ];

        res.json({
            success: true,
            chainId: parseInt(chainId),
            listings: mockListings.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
            pagination: {
                total: mockListings.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < mockListings.length
            },
            crossChainStats: {
                totalCrossChainListings: mockListings.length,
                supportedChains: [11155111, 137, 43114, 80001, 43113],
                averageTransferTime: '5.2 minutes',
                averageTransferFee: '0.001',
                successRate: '98.5%'
            }
        });
    });

    // POST /api/crosschain/marketplace/list
    router.post('/marketplace/list', [
        body('tokenId').isInt({ min: 1 }).withMessage('Token ID must be a positive integer'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('seller').isEthereumAddress().withMessage('Seller must be a valid Ethereum address'),
        body('propertyId').isString().withMessage('Property ID must be a string'),
        body('sourceChain').isInt({ min: 1 }).withMessage('Source chain must be a positive integer'),
        body('destinationChains').optional().isArray().withMessage('Destination chains must be an array'),
        body('crossChainEnabled').optional().isBoolean().withMessage('Cross-chain enabled must be a boolean'),
        handleValidationErrors
    ], (req, res) => {
        const { tokenId, price, seller, propertyId, sourceChain, destinationChains, crossChainEnabled = true } = req.body;

        const listingId = Math.floor(Math.random() * 1000000) + 1;
        const newListing = {
            id: listingId,
            tokenId: parseInt(tokenId),
            propertyId: propertyId,
            price: price.toString(),
            seller: seller,
            sourceChain: parseInt(sourceChain),
            destinationChains: destinationChains || [11155111, 137, 43114], // Default to main chains
            listedAt: new Date().toISOString(),
            active: true,
            crossChainEnabled: crossChainEnabled,
            transferFee: crossChainEnabled ? '0.001' : '0',
            estimatedTransferTime: crossChainEnabled ? '5-10 minutes' : 'N/A'
        };

        mockDB.crossChainListings = mockDB.crossChainListings || [];
        mockDB.crossChainListings.push(newListing);

        res.json({
            success: true,
            listing: newListing,
            message: crossChainEnabled ? 'Cross-chain listing created successfully' : 'Listing created successfully',
            crossChainInfo: crossChainEnabled ? {
                supportedChains: destinationChains || [11155111, 137, 43114],
                transferFee: '0.001',
                estimatedTime: '5-10 minutes',
                features: ['Cross-chain transfer', 'Multi-chain visibility', 'Automatic fee calculation']
            } : null
        });
    });

    // GET /api/crosschain/stats
    router.get('/stats', (req, res) => {
        mockDB.crossChainTransfers = mockDB.crossChainTransfers || [];
        
        const totalTransfers = mockDB.crossChainTransfers.length;
        const completedTransfers = mockDB.crossChainTransfers.filter(t => t.status === 'completed').length;
        const pendingTransfers = mockDB.crossChainTransfers.filter(t => t.status === 'pending').length;
        const failedTransfers = mockDB.crossChainTransfers.filter(t => t.status === 'failed').length;

        // Calculate total volume
        const totalVolume = mockDB.crossChainTransfers
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + parseFloat(t.fee || 0), 0);

        // Calculate average transfer time
        const completedTransfersWithTime = mockDB.crossChainTransfers
            .filter(t => t.status === 'completed' && t.completedAt && t.initiatedAt);
        
        const averageTransferTime = completedTransfersWithTime.length > 0
            ? completedTransfersWithTime.reduce((sum, t) => {
                const duration = new Date(t.completedAt).getTime() - new Date(t.initiatedAt).getTime();
                return sum + duration;
            }, 0) / completedTransfersWithTime.length / 1000 / 60 // Convert to minutes
            : 5.2;

        res.json({
            success: true,
            stats: {
                totalTransfers,
                completedTransfers,
                pendingTransfers,
                failedTransfers,
                successRate: totalTransfers > 0 ? (completedTransfers / totalTransfers * 100).toFixed(2) : 0,
                totalVolume: totalVolume.toFixed(6),
                averageTransferTime: `${averageTransferTime.toFixed(1)} minutes`,
                supportedChains: 6,
                activeTransfers: pendingTransfers
            },
            chainStats: {
                '11155111': { transfers: 45, volume: '0.045', successRate: '97.8%' },
                '137': { transfers: 32, volume: '0.32', successRate: '98.4%' },
                '43114': { transfers: 18, volume: '0.018', successRate: '94.4%' },
                '80001': { transfers: 28, volume: '0.028', successRate: '96.4%' },
                '43113': { transfers: 15, volume: '0.015', successRate: '93.3%' }
            },
            trends: {
                dailyTransfers: [12, 15, 18, 22, 19, 25, 28],
                weeklyVolume: ['0.045', '0.052', '0.061', '0.058', '0.067', '0.073', '0.081'],
                successRateTrend: ['96.2%', '97.1%', '98.3%', '97.8%', '98.5%', '98.9%', '99.1%']
            }
        });
    });

    // POST /api/crosschain/retry/:transferId
    router.post('/retry/:transferId', [
        param('transferId').isHexadecimal().withMessage('Transfer ID must be a valid hexadecimal'),
        handleValidationErrors
    ], (req, res) => {
        const { transferId } = req.params;

        mockDB.crossChainTransfers = mockDB.crossChainTransfers || [];
        const transfer = mockDB.crossChainTransfers.find(t => t.transferId === transferId);

        if (!transfer) {
            return res.status(404).json({
                error: 'Transfer not found',
                transferId: transferId
            });
        }

        if (transfer.status !== 'failed') {
            return res.status(400).json({
                error: 'Transfer cannot be retried',
                currentStatus: transfer.status
            });
        }

        if (transfer.retryCount >= transfer.maxRetries) {
            return res.status(400).json({
                error: 'Maximum retry attempts reached',
                retryCount: transfer.retryCount,
                maxRetries: transfer.maxRetries
            });
        }

        // Retry the transfer
        transfer.status = 'pending';
        transfer.retryCount += 1;
        transfer.lastRetryAt = new Date().toISOString();
        transfer.estimatedCompletion = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        transfer.error = null;

        res.json({
            success: true,
            transferId: transferId,
            status: 'pending',
            retryCount: transfer.retryCount,
            message: 'Transfer retry initiated successfully'
        });
    });

    // DELETE /api/crosschain/transfer/:transferId
    router.delete('/transfer/:transferId', [
        param('transferId').isHexadecimal().withMessage('Transfer ID must be a valid hexadecimal'),
        handleValidationErrors
    ], (req, res) => {
        const { transferId } = req.params;

        mockDB.crossChainTransfers = mockDB.crossChainTransfers || [];
        const transferIndex = mockDB.crossChainTransfers.findIndex(t => t.transferId === transferId);

        if (transferIndex === -1) {
            return res.status(404).json({
                error: 'Transfer not found',
                transferId: transferId
            });
        }

        const transfer = mockDB.crossChainTransfers[transferIndex];

        if (transfer.status !== 'pending') {
            return res.status(400).json({
                error: 'Only pending transfers can be cancelled',
                currentStatus: transfer.status
            });
        }

        // Cancel the transfer
        transfer.status = 'cancelled';
        transfer.cancelledAt = new Date().toISOString();

        res.json({
            success: true,
            transferId: transferId,
            status: 'cancelled',
            message: 'Transfer cancelled successfully'
        });
    });

    return router;
}; 