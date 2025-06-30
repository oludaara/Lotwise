const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const ContractService = require('../services/contractService');

module.exports = ({ Property }) => {
    const contractService = new ContractService();

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

    // GET /api/properties - List all properties
    router.get('/', [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
        query('status').optional().isIn(['active', 'inactive', 'pending', 'verified', 'unverified']).withMessage('Invalid status'),
        query('type').optional().isIn(['residential', 'commercial', 'industrial', 'land']).withMessage('Invalid property type'),
        query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
        query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
        query('location').optional().isString().withMessage('Location must be a string'),
        handleValidationErrors
    ], (req, res) => {
        const {
            limit = 20,
            offset = 0,
            status,
            type,
            minPrice,
            maxPrice,
            location
        } = req.query;

        // Mock properties data
        const mockProperties = [
            {
                id: 'PROP001',
                name: 'Luxury Manhattan Apartment',
                address: '123 Park Avenue, New York, NY 10022',
                description: 'Stunning 3-bedroom apartment with city views',
                type: 'residential',
                status: 'verified',
                totalValue: '2500000000000000000000000', // 2.5M USD
                tokenPrice: '2500000000000000000000', // 2500 USD per token
                totalTokens: 1000,
                availableTokens: 750,
                imageUrl: '/images/luxury-apartment.jpg',
                location: {
                    city: 'New York',
                    state: 'NY',
                    country: 'USA',
                    coordinates: { lat: 40.7589, lng: -73.9851 }
                },
                features: ['Balcony', 'Gym', 'Pool', 'Doorman'],
                yield: '0.085', // 8.5% annual yield
                createdAt: '2024-01-15T10:30:00Z',
                updatedAt: '2024-01-20T14:45:00Z',
                verifiedAt: '2024-01-18T09:15:00Z',
                chainId: 11155111,
                contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                crossChainEnabled: true,
                supportedChains: [11155111, 137, 43114]
            },
            {
                id: 'PROP002',
                name: 'Beverly Hills Townhouse',
                address: '456 Oak Avenue, Los Angeles, CA 90210',
                description: 'Modern 4-bedroom townhouse in prime location',
                type: 'residential',
                status: 'verified',
                totalValue: '1800000000000000000000000', // 1.8M USD
                tokenPrice: '1800000000000000000000', // 1800 USD per token
                totalTokens: 1000,
                availableTokens: 600,
                imageUrl: '/images/modern-townhouse.jpg',
                location: {
                    city: 'Los Angeles',
                    state: 'CA',
                    country: 'USA',
                    coordinates: { lat: 34.0736, lng: -118.4004 }
                },
                features: ['Garden', 'Garage', 'Security System'],
                yield: '0.072', // 7.2% annual yield
                createdAt: '2024-01-10T08:20:00Z',
                updatedAt: '2024-01-19T16:30:00Z',
                verifiedAt: '2024-01-12T11:45:00Z',
                chainId: 137,
                contractAddress: '0x8ba1f109551bD432803012645Hac136c772c3',
                crossChainEnabled: true,
                supportedChains: [11155111, 137, 43114]
            },
            {
                id: 'PROP003',
                name: 'Downtown Office Complex',
                address: '789 Business Blvd, Chicago, IL 60601',
                description: 'Class A office building in financial district',
                type: 'commercial',
                status: 'verified',
                totalValue: '5000000000000000000000000', // 5M USD
                tokenPrice: '5000000000000000000000', // 5000 USD per token
                totalTokens: 1000,
                availableTokens: 400,
                imageUrl: '/images/office-complex.jpg',
                location: {
                    city: 'Chicago',
                    state: 'IL',
                    country: 'USA',
                    coordinates: { lat: 41.8781, lng: -87.6298 }
                },
                features: ['Parking', 'Conference Rooms', 'Cafeteria'],
                yield: '0.095', // 9.5% annual yield
                createdAt: '2024-01-05T12:15:00Z',
                updatedAt: '2024-01-21T10:20:00Z',
                verifiedAt: '2024-01-08T14:30:00Z',
                chainId: 43114,
                contractAddress: '0x9c8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8',
                crossChainEnabled: true,
                supportedChains: [11155111, 137, 43114]
            }
        ];

        let filteredProperties = mockProperties;

        // Apply filters
        if (status) {
            filteredProperties = filteredProperties.filter(p => p.status === status);
        }

        if (type) {
            filteredProperties = filteredProperties.filter(p => p.type === type);
        }

        if (minPrice) {
            filteredProperties = filteredProperties.filter(p =>
                parseFloat(p.tokenPrice) >= parseFloat(minPrice) * 1e18
            );
        }

        if (maxPrice) {
            filteredProperties = filteredProperties.filter(p =>
                parseFloat(p.tokenPrice) <= parseFloat(maxPrice) * 1e18
            );
        }

        if (location) {
            filteredProperties = filteredProperties.filter(p =>
                p.location.city.toLowerCase().includes(location.toLowerCase()) ||
                p.location.state.toLowerCase().includes(location.toLowerCase())
            );
        }

        // Apply pagination
        const total = filteredProperties.length;
        const properties = filteredProperties.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        // Calculate statistics
        const stats = {
            total: total,
            verified: mockProperties.filter(p => p.status === 'verified').length,
            residential: mockProperties.filter(p => p.type === 'residential').length,
            commercial: mockProperties.filter(p => p.type === 'commercial').length,
            totalValue: mockProperties.reduce((sum, p) => sum + parseFloat(p.totalValue), 0).toFixed(0),
            averageYield: (mockProperties.reduce((sum, p) => sum + parseFloat(p.yield), 0) / mockProperties.length * 100).toFixed(1)
        };

        res.json({
            success: true,
            properties: properties,
            pagination: {
                total: total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < total
            },
            stats: stats,
            filters: {
                applied: { status, type, minPrice, maxPrice, location },
                available: {
                    statuses: ['active', 'inactive', 'pending', 'verified', 'unverified'],
                    types: ['residential', 'commercial', 'industrial', 'land']
                }
            }
        });
    });

    // GET /api/properties/:id - Get property details
    router.get('/:id', [
        param('id').isString().withMessage('Property ID must be a string'),
        handleValidationErrors
    ], (req, res) => {
        const { id } = req.params;

        // Mock property data
        const mockProperty = {
            id: id,
            name: 'Luxury Manhattan Apartment',
            address: '123 Park Avenue, New York, NY 10022',
            description: 'Stunning 3-bedroom apartment with city views and modern amenities. This luxury property features high-end finishes, smart home technology, and breathtaking views of the Manhattan skyline.',
            type: 'residential',
            status: 'verified',
            totalValue: '2500000000000000000000000', // 2.5M USD
            tokenPrice: '2500000000000000000000', // 2500 USD per token
            totalTokens: 1000,
            availableTokens: 750,
            soldTokens: 250,
            imageUrl: '/images/luxury-apartment.jpg',
            images: [
                '/images/luxury-apartment.jpg',
                '/images/luxury-apartment-2.jpg',
                '/images/luxury-apartment-3.jpg'
            ],
            location: {
                city: 'New York',
                state: 'NY',
                country: 'USA',
                zipCode: '10022',
                coordinates: { lat: 40.7589, lng: -73.9851 },
                neighborhood: 'Midtown Manhattan'
            },
            features: ['Balcony', 'Gym', 'Pool', 'Doorman', 'Smart Home', 'Parking'],
            amenities: ['24/7 Concierge', 'Fitness Center', 'Swimming Pool', 'Rooftop Terrace'],
            specifications: {
                bedrooms: 3,
                bathrooms: 2.5,
                squareFeet: 2500,
                yearBuilt: 2020,
                floors: 25
            },
            yield: '0.085', // 8.5% annual yield
            monthlyRent: '17500000000000000000000', // 17,500 USD
            annualYield: '210000000000000000000000', // 210,000 USD
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-20T14:45:00Z',
            verifiedAt: '2024-01-18T09:15:00Z',
            chainId: 11155111,
            contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            crossChainEnabled: true,
            supportedChains: [11155111, 137, 43114],
            tokenHolders: [
                {
                    address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                    tokens: 50,
                    percentage: '5%',
                    joinedAt: '2024-01-16T12:00:00Z'
                },
                {
                    address: '0x8ba1f109551bD432803012645Hac136c772c3',
                    tokens: 30,
                    percentage: '3%',
                    joinedAt: '2024-01-17T14:30:00Z'
                }
            ],
            recentTransactions: [
                {
                    type: 'purchase',
                    amount: 5,
                    price: '2500000000000000000000',
                    buyer: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                    timestamp: '2024-01-20T10:30:00Z',
                    transactionHash: '0x1234567890abcdef'
                },
                {
                    type: 'purchase',
                    amount: 3,
                    price: '2500000000000000000000',
                    buyer: '0x8ba1f109551bD432803012645Hac136c772c3',
                    timestamp: '2024-01-19T16:45:00Z',
                    transactionHash: '0xabcdef1234567890'
                }
            ],
            marketData: {
                priceHistory: [
                    { date: '2024-01-15', price: '2400000000000000000000' },
                    { date: '2024-01-16', price: '2450000000000000000000' },
                    { date: '2024-01-17', price: '2480000000000000000000' },
                    { date: '2024-01-18', price: '2500000000000000000000' },
                    { date: '2024-01-19', price: '2500000000000000000000' },
                    { date: '2024-01-20', price: '2500000000000000000000' }
                ],
                volume24h: '12500000000000000000000', // 12,500 USD
                priceChange24h: '0.02', // +2%
                marketCap: '2500000000000000000000000' // 2.5M USD
            }
        };

        if (id !== 'PROP001') {
            return res.status(404).json({
                error: 'Property not found',
                propertyId: id
            });
        }

        res.json({
            success: true,
            property: mockProperty
        });
    });

    // POST /api/properties/:id/verify - Verify property via Chainlink Functions
    router.post('/:id/verify', [
        param('id').isString().withMessage('Property ID must be a string'),
        body('verificationData').isObject().withMessage('Verification data must be an object'),
        body('verificationData.propertyAddress').isString().withMessage('Property address is required'),
        body('verificationData.propertyType').isString().withMessage('Property type is required'),
        body('verificationData.estimatedValue').isFloat({ min: 0 }).withMessage('Estimated value must be a positive number'),
        body('verificationData.documents').optional().isArray().withMessage('Documents must be an array'),
        handleValidationErrors
    ], (req, res) => {
        const { id } = req.params;
        const { verificationData } = req.body;

        // Simulate Chainlink Functions verification
        const verificationId = '0x' + Math.random().toString(16).substr(2, 64);
        const functionId = '0x' + Math.random().toString(16).substr(2, 64);

        // Mock verification process
        const verificationResult = {
            verificationId: verificationId,
            functionId: functionId,
            propertyId: id,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
            verificationData: verificationData,
            chainlinkResponse: {
                success: true,
                data: {
                    propertyVerified: true,
                    estimatedValue: verificationData.estimatedValue,
                    confidenceScore: 0.95,
                    verificationSource: 'Chainlink Functions - Property Verification',
                    timestamp: new Date().toISOString()
                }
            }
        };

        // Store verification record
        mockDB.propertyVerifications = mockDB.propertyVerifications || [];
        mockDB.propertyVerifications.push(verificationResult);

        res.json({
            success: true,
            verificationId: verificationId,
            functionId: functionId,
            propertyId: id,
            status: 'pending',
            message: 'Property verification initiated via Chainlink Functions',
            estimatedTime: '5 minutes',
            nextSteps: [
                'Verification is being processed by Chainlink Functions',
                'You will receive notification upon completion',
                'Property status will be updated automatically'
            ]
        });
    });

    // GET /api/properties/:id/verification/:verificationId - Get verification status
    router.get('/:id/verification/:verificationId', [
        param('id').isString().withMessage('Property ID must be a string'),
        param('verificationId').isHexadecimal().withMessage('Verification ID must be a valid hexadecimal'),
        handleValidationErrors
    ], (req, res) => {
        const { id, verificationId } = req.params;

        mockDB.propertyVerifications = mockDB.propertyVerifications || [];
        const verification = mockDB.propertyVerifications.find(v =>
            v.verificationId === verificationId && v.propertyId === id
        );

        if (!verification) {
            return res.status(404).json({
                error: 'Verification not found',
                verificationId: verificationId,
                propertyId: id
            });
        }

        // Simulate verification completion after some time
        const submittedTime = new Date(verification.submittedAt).getTime();
        const currentTime = Date.now();
        const timeElapsed = currentTime - submittedTime;

        if (timeElapsed > 5 * 60 * 1000 && verification.status === 'pending') {
            verification.status = 'completed';
            verification.completedAt = new Date().toISOString();
            verification.result = {
                verified: true,
                confidenceScore: 0.95,
                estimatedValue: verification.verificationData.estimatedValue,
                verificationSource: 'Chainlink Functions',
                blockchainProof: '0x' + Math.random().toString(16).substr(2, 64)
            };
        }

        res.json({
            success: true,
            verification: verification
        });
    });

    // GET /api/properties/enhanced - Get properties with blockchain data
    router.get('/enhanced', async (req, res) => {
        try {
            const { limit = 10, offset = 0 } = req.query;
            
            // Get properties from database
            const properties = await Property.find()
                .skip(Number(offset))
                .limit(Number(limit));
            
            // Enhance with blockchain data
            const enhancedProperties = await Promise.all(
                properties.map(async (property) => {
                    try {
                        // Get blockchain data for each property
                        const blockchainData = await contractService.getProperty(property.id);
                        return {
                            ...property.toObject(),
                            blockchain: blockchainData,
                            onChain: true
                        };
                    } catch (error) {
                        // If property doesn't exist on blockchain, return database data only
                        return {
                            ...property.toObject(),
                            blockchain: null,
                            onChain: false
                        };
                    }
                })
            );

            const total = await Property.countDocuments();

            res.json({
                success: true,
                properties: enhancedProperties,
                total,
                limit: Number(limit),
                offset: Number(offset)
            });
        } catch (error) {
            console.error('❌ Error fetching enhanced properties:', error);
            res.status(500).json({ error: 'Failed to fetch properties' });
        }
    });

    // POST /api/properties/enhanced/create - Create property on blockchain
    router.post('/enhanced/create', async (req, res) => {
        try {
            const {
                propertyId,
                address,
                totalValue,
                totalTokens,
                tokenPrice,
                metadata,
                description,
                location,
                propertyType
            } = req.body;

            // Validate required fields
            if (!propertyId || !address || !totalValue || !totalTokens || !tokenPrice) {
                return res.status(400).json({
                    error: 'Missing required fields: propertyId, address, totalValue, totalTokens, tokenPrice'
                });
            }

            // Create property on blockchain
            const blockchainResult = await contractService.createProperty({
                propertyId,
                address,
                totalValue: ethers.parseEther(totalValue.toString()),
                totalTokens: parseInt(totalTokens),
                tokenPrice: ethers.parseEther(tokenPrice.toString()),
                metadata: metadata || ''
            });

            // Save to database
            const property = new Property({
                id: propertyId,
                address,
                totalValue: parseFloat(totalValue),
                totalTokens: parseInt(totalTokens),
                tokenPrice: parseFloat(tokenPrice),
                description: description || '',
                location: location || '',
                propertyType: propertyType || 'residential',
                verified: false,
                crossChainEnabled: false,
                createdAt: new Date()
            });

            await property.save();

            res.json({
                success: true,
                message: 'Property created successfully on blockchain and database',
                property: {
                    ...property.toObject(),
                    blockchain: blockchainResult
                }
            });
        } catch (error) {
            console.error('❌ Error creating property:', error);
            res.status(500).json({ error: 'Failed to create property' });
        }
    });

    // POST /api/properties/enhanced/:id/mint - Mint tokens for property
    router.post('/enhanced/:id/mint', async (req, res) => {
        try {
            const { id } = req.params;
            const { recipient, tokenId, quantity = 1 } = req.body;

            if (!recipient || !tokenId) {
                return res.status(400).json({
                    error: 'Missing required fields: recipient, tokenId'
                });
            }

            const mintResults = [];
            
            // Mint multiple tokens if quantity > 1
            for (let i = 0; i < quantity; i++) {
                const currentTokenId = parseInt(tokenId) + i;
                const result = await contractService.mintToken(parseInt(id), recipient, currentTokenId);
                mintResults.push(result);
            }

            // Update database
            const property = await Property.findOne({ id });
            if (property) {
                property.mintedTokens = (property.mintedTokens || 0) + quantity;
                await property.save();
            }

            res.json({
                success: true,
                message: `Successfully minted ${quantity} token(s)`,
                results: mintResults,
                property: property ? property.toObject() : null
            });
        } catch (error) {
            console.error('❌ Error minting tokens:', error);
            res.status(500).json({ error: 'Failed to mint tokens' });
        }
    });

    // GET /api/properties/enhanced/:id/blockchain - Get blockchain data for property
    router.get('/enhanced/:id/blockchain', async (req, res) => {
        try {
            const { id } = req.params;
            
            const blockchainData = await contractService.getProperty(parseInt(id));
            
            res.json({
                success: true,
                propertyId: id,
                blockchain: blockchainData
            });
        } catch (error) {
            console.error('❌ Error fetching blockchain data:', error);
            res.status(500).json({ error: 'Failed to fetch blockchain data' });
        }
    });

    // GET /api/properties/enhanced/:id/tokens - Get token information
    router.get('/enhanced/:id/tokens', async (req, res) => {
        try {
            const { id } = req.params;
            const { tokenId } = req.query;

            if (tokenId) {
                // Get specific token info
                const owner = await contractService.getTokenOwner(parseInt(tokenId));
                const uri = await contractService.getTokenURI(parseInt(tokenId));
                
                res.json({
                    success: true,
                    tokenId: parseInt(tokenId),
                    owner,
                    tokenURI: uri,
                    propertyId: id
                });
            } else {
                // Get total supply for property
                const totalSupply = await contractService.getTotalSupply();
                
                res.json({
                    success: true,
                    propertyId: id,
                    totalSupply: parseInt(totalSupply)
                });
            }
        } catch (error) {
            console.error('❌ Error fetching token data:', error);
            res.status(500).json({ error: 'Failed to fetch token data' });
        }
    });

    // POST /api/properties/enhanced/:id/list - List token for sale
    router.post('/enhanced/:id/list', async (req, res) => {
        try {
            const { tokenId, price } = req.body;

            if (!tokenId || !price) {
                return res.status(400).json({
                    error: 'Missing required fields: tokenId, price'
                });
            }

            const result = await contractService.listToken(parseInt(tokenId), price.toString());

            res.json({
                success: true,
                message: 'Token listed successfully',
                result
            });
        } catch (error) {
            console.error('❌ Error listing token:', error);
            res.status(500).json({ error: 'Failed to list token' });
        }
    });

    // POST /api/properties/enhanced/:id/buy - Buy listed token
    router.post('/enhanced/:id/buy', async (req, res) => {
        try {
            const { tokenId, price } = req.body;

            if (!tokenId || !price) {
                return res.status(400).json({
                    error: 'Missing required fields: tokenId, price'
                });
            }

            const result = await contractService.buyToken(parseInt(tokenId), price.toString());

            res.json({
                success: true,
                message: 'Token purchased successfully',
                result
            });
        } catch (error) {
            console.error('❌ Error buying token:', error);
            res.status(500).json({ error: 'Failed to buy token' });
        }
    });

    // POST /api/properties/enhanced/:id/cancel-listing - Cancel token listing
    router.post('/enhanced/:id/cancel-listing', async (req, res) => {
        try {
            const { tokenId } = req.body;

            if (!tokenId) {
                return res.status(400).json({
                    error: 'Missing required field: tokenId'
                });
            }

            const result = await contractService.cancelListing(parseInt(tokenId));

            res.json({
                success: true,
                message: 'Listing cancelled successfully',
                result
            });
        } catch (error) {
            console.error('❌ Error cancelling listing:', error);
            res.status(500).json({ error: 'Failed to cancel listing' });
        }
    });

    // GET /api/properties/enhanced/:id/listings - Get token listings
    router.get('/enhanced/:id/listings', async (req, res) => {
        try {
            const { id } = req.params;
            const { tokenId } = req.query;

            if (tokenId) {
                // Get specific token listing
                const listing = await contractService.getTokenListing(parseInt(tokenId));
                const isListed = await contractService.isTokenListed(parseInt(tokenId));
                
                res.json({
                    success: true,
                    tokenId: parseInt(tokenId),
                    listing,
                    isListed
                });
            } else {
                // Get all listings for property (this would require additional contract methods)
                res.json({
                    success: true,
                    message: 'Use tokenId parameter to get specific listing',
                    propertyId: id
                });
            }
        } catch (error) {
            console.error('❌ Error fetching listings:', error);
            res.status(500).json({ error: 'Failed to fetch listings' });
        }
    });

    // POST /api/properties/enhanced/:id/request-random - Request VRF random value
    router.post('/enhanced/:id/request-random', async (req, res) => {
        try {
            const { id } = req.params;
            
            const result = await contractService.requestRandomValue(parseInt(id));

            res.json({
                success: true,
                message: 'Random value request submitted',
                result
            });
        } catch (error) {
            console.error('❌ Error requesting random value:', error);
            res.status(500).json({ error: 'Failed to request random value' });
        }
    });

    // GET /api/properties/enhanced/prices - Get price feeds
    router.get('/enhanced/prices', async (req, res) => {
        try {
            const { currency } = req.query;

            let prices;
            if (currency) {
                switch (currency.toLowerCase()) {
                    case 'eth':
                        prices = { ethUsd: await contractService.getEthUsdPrice() };
                        break;
                    case 'btc':
                        prices = { btcUsd: await contractService.getBtcUsdPrice() };
                        break;
                    case 'avax':
                        prices = { avaxUsd: await contractService.getAvaxUsdPrice() };
                        break;
                    default:
                        prices = await contractService.getAllPrices();
                }
            } else {
                prices = await contractService.getAllPrices();
            }

            res.json({
                success: true,
                prices,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Error fetching prices:', error);
            res.status(500).json({ error: 'Failed to fetch prices' });
        }
    });

    // GET /api/properties/enhanced/contract-info - Get contract information
    router.get('/enhanced/contract-info', async (req, res) => {
        try {
            const addresses = await contractService.getContractAddresses();
            const signerAddress = await contractService.getSignerAddress();
            const balance = signerAddress ? await contractService.getBalance(signerAddress) : null;

            res.json({
                success: true,
                contracts: addresses,
                signer: signerAddress,
                balance: balance ? `${balance} ETH` : null,
                network: 'Sepolia'
            });
        } catch (error) {
            console.error('❌ Error fetching contract info:', error);
            res.status(500).json({ error: 'Failed to fetch contract info' });
        }
    });

    return router;
}; 