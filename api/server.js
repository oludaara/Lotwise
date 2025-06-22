const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Mock database for demonstration
const mockDB = {
    properties: [
        {
            id: "PROP-001",
            address: "123 Main St, San Francisco, CA",
            totalValue: 1000000,
            tokenPrice: 1000,
            totalTokens: 1000,
            mintedTokens: 450,
            description: "Luxury downtown apartment building",
            imageUrl: "https://example.com/property1.jpg",
            yearBuilt: 2018,
            squareFeet: 50000,
            propertyType: "Multi-Family",
            neighborhood: "SOMA",
            amenities: ["Gym", "Rooftop", "Parking", "Concierge"],
            coordinates: { lat: 37.7749, lng: -122.4194 },
            verified: true,
            aaveStats: {
                totalSupplied: 150000,
                totalBorrowed: 100000,
                averageAPY: 5.2,
                totalYieldDistributed: 7500
            },
            owners: [
                { address: "0x1234567890abcdef1234567890abcdef12345678", tokens: 50, percentage: 5.0 },
                { address: "0x742d35Cc6664C4532123C75F51C69c6CBc12345a", tokens: 100, percentage: 10.0 },
                { address: "0xabcdef1234567890abcdef1234567890abcdef12", tokens: 300, percentage: 30.0 }
            ]
        },
        {
            id: "PROP-002", 
            address: "456 Ocean Ave, Los Angeles, CA",
            totalValue: 2500000,
            tokenPrice: 2500,
            totalTokens: 1000,
            mintedTokens: 750,
            description: "Beachfront luxury condominiums",
            imageUrl: "https://example.com/property2.jpg",
            yearBuilt: 2020,
            squareFeet: 75000,
            propertyType: "Condominium",
            neighborhood: "Santa Monica",
            amenities: ["Beach Access", "Pool", "Spa", "Valet"],
            coordinates: { lat: 34.0522, lng: -118.2437 },
            verified: true,
            aaveStats: {
                totalSupplied: 500000,
                totalBorrowed: 350000,
                averageAPY: 4.8,
                totalYieldDistributed: 24000
            },
            owners: [
                { address: "0x1234567890abcdef1234567890abcdef12345678", tokens: 200, percentage: 20.0 },
                { address: "0x742d35Cc6664C4532123C75F51C69c6CBc12345a", tokens: 150, percentage: 15.0 },
                { address: "0xabcdef1234567890abcdef1234567890abcdef12", tokens: 400, percentage: 40.0 }
            ]
        }
    ],
    users: [
        {
            address: "0x1234567890abcdef1234567890abcdef12345678",
            totalTokens: 75,
            portfolioValue: 175000,
            totalSuppliedToAave: 50000,
            totalBorrowedFromAave: 30000,
            healthFactor: 85,
            claimableYield: 1250,
            properties: ["PROP-001", "PROP-002"]
        },
        {
            address: "0x742d35Cc6664C4532123C75F51C69c6CBc12345a",
            totalTokens: 25,
            portfolioValue: 75000,
            totalSuppliedToAave: 15000,
            totalBorrowedFromAave: 10000,
            healthFactor: 92,
            claimableYield: 450,
            properties: ["PROP-001"]
        },
        {
            address: "0xabcdef1234567890abcdef1234567890abcdef12",
            totalTokens: 150,
            portfolioValue: 425000,
            totalSuppliedToAave: 100000,
            totalBorrowedFromAave: 60000,
            healthFactor: 78,
            claimableYield: 2100,
            properties: ["PROP-001", "PROP-002"]
        }
    ],
    marketplace: [
        {
            id: 1,
            tokenId: 123,
            propertyId: "PROP-001",
            price: 1050,
            seller: "0x1234...abcd",
            listedAt: "2024-01-15T10:30:00Z",
            active: true
        },
        {
            id: 2,
            tokenId: 456,
            propertyId: "PROP-002", 
            price: 2600,
            seller: "0x5678...efgh",
            listedAt: "2024-01-16T14:20:00Z",
            active: true
        }
    ],
    priceHistory: [
        { timestamp: "2024-01-01", ethPrice: 2000, maticPrice: 0.8 },
        { timestamp: "2024-01-02", ethPrice: 2050, maticPrice: 0.82 },
        { timestamp: "2024-01-03", ethPrice: 1980, maticPrice: 0.79 },
        { timestamp: "2024-01-04", ethPrice: 2100, maticPrice: 0.85 }
    ]
};

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: [
            'Fractional Ownership',
            'Aave Integration',
            'Cross-chain Support',
            'Yield Distribution',
            'Liquidation Management'
        ]
    });
});

// Property routes
app.get('/api/properties', (req, res) => {
    const { limit = 10, offset = 0, verified } = req.query;
    
    let properties = mockDB.properties;
    
    if (verified !== undefined) {
        properties = properties.filter(p => p.verified === (verified === 'true'));
    }
    
    const paginatedProperties = properties.slice(offset, offset + parseInt(limit));
    
    res.json({
        properties: paginatedProperties,
        total: properties.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
    });
});

app.get('/api/properties/:id', (req, res) => {
    const property = mockDB.properties.find(p => p.id === req.params.id);
    
    if (!property) {
        return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(property);
});

app.post('/api/properties/:id/verify', (req, res) => {
    const { id } = req.params;
    const property = mockDB.properties.find(p => p.id === id);
    
    if (!property) {
        return res.status(404).json({ error: 'Property not found' });
    }
    
    // Mock verification process
    setTimeout(() => {
        property.verified = true;
        res.json({ 
            verified: true, 
            message: 'Property verified successfully',
            valuation: property.totalValue
        });
    }, 1000);
});

// User portfolio routes
app.get('/api/users/:address', (req, res) => {
    const { address } = req.params;
    const user = mockDB.users.find(u => u.address.toLowerCase() === address.toLowerCase());
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
});

app.get('/api/users/:address/portfolio', (req, res) => {
    const { address } = req.params;
    const user = mockDB.users.find(u => u.address.toLowerCase() === address.toLowerCase());
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const userProperties = mockDB.properties.filter(p => 
        user.properties.includes(p.id)
    );
    
    res.json({
        address: user.address,
        totalTokens: user.totalTokens,
        portfolioValue: user.portfolioValue,
        properties: userProperties,
        aavePosition: {
            totalSupplied: user.totalSuppliedToAave,
            totalBorrowed: user.totalBorrowedFromAave,
            healthFactor: user.healthFactor,
            maxBorrowable: Math.floor(user.totalSuppliedToAave * 0.75)
        },
        claimableYield: user.claimableYield
    });
});

// Aave integration routes
app.get('/api/aave/position/:address', (req, res) => {
    const { address } = req.params;
    const user = mockDB.users.find(u => u.address.toLowerCase() === address.toLowerCase());
    
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
        currentAPY: 5.2
    });
});

app.post('/api/aave/supply', (req, res) => {
    const { address, tokenIds, amount } = req.body;
    
    // Mock supply operation
    res.json({
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        suppliedAmount: amount,
        newHealthFactor: 95,
        message: 'Tokens supplied as collateral successfully'
    });
});

app.post('/api/aave/borrow', (req, res) => {
    const { address, amount, asset } = req.body;
    
    // Mock borrow operation
    res.json({
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        borrowedAmount: amount,
        asset: asset,
        newHealthFactor: 82,
        message: 'Assets borrowed successfully'
    });
});

app.post('/api/aave/repay', (req, res) => {
    const { address, amount, asset } = req.body;
    
    // Mock repay operation
    res.json({
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        repaidAmount: amount,
        asset: asset,
        newHealthFactor: 92,
        message: 'Loan repaid successfully'
    });
});

// Yield distribution routes
app.get('/api/yield/:propertyId', (req, res) => {
    const { propertyId } = req.params;
    const property = mockDB.properties.find(p => p.id === propertyId);
    
    if (!property) {
        return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json({
        propertyId: property.id,
        totalYieldPool: property.aaveStats.totalYieldDistributed,
        currentAPY: property.aaveStats.averageAPY,
        nextDistribution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        totalOwners: property.owners.length,
        averageYieldPerToken: property.aaveStats.totalYieldDistributed / property.mintedTokens
    });
});

app.get('/api/yield/:propertyId/:address', (req, res) => {
    const { propertyId, address } = req.params;
    const property = mockDB.properties.find(p => p.id === propertyId);
    
    if (!property) {
        return res.status(404).json({ error: 'Property not found' });
    }
    
    const owner = property.owners.find(o => 
        o.address.toLowerCase() === address.toLowerCase()
    );
    
    if (!owner) {
        return res.status(404).json({ error: 'User is not an owner of this property' });
    }
    
    const claimableYield = Math.floor(owner.tokens * 2.5); // Mock calculation
    
    res.json({
        propertyId: property.id,
        userAddress: address,
        tokensOwned: owner.tokens,
        ownershipPercentage: owner.percentage,
        claimableYield: claimableYield,
        totalYieldEarned: claimableYield * 2, // Mock historical data
        lastClaimed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    });
});

app.post('/api/yield/claim', (req, res) => {
    const { address, propertyId } = req.body;
    
    // Mock yield claim
    res.json({
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        claimedAmount: 125.50,
        propertyId: propertyId,
        message: 'Yield claimed successfully'
    });
});

// Marketplace routes
app.get('/api/marketplace', (req, res) => {
    const { propertyId, minPrice, maxPrice, limit = 20, offset = 0 } = req.query;
    
    let listings = mockDB.marketplace.filter(l => l.active);
    
    if (propertyId) {
        listings = listings.filter(l => l.propertyId === propertyId);
    }
    
    if (minPrice) {
        listings = listings.filter(l => l.price >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
        listings = listings.filter(l => l.price <= parseFloat(maxPrice));
    }
    
    const paginatedListings = listings.slice(offset, offset + parseInt(limit));
    
    res.json({
        listings: paginatedListings,
        total: listings.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
    });
});

app.post('/api/marketplace/list', (req, res) => {
    const { tokenId, price, seller, propertyId } = req.body;
    
    const newListing = {
        id: mockDB.marketplace.length + 1,
        tokenId: tokenId,
        propertyId: propertyId,
        price: price,
        seller: seller,
        listedAt: new Date().toISOString(),
        active: true
    };
    
    mockDB.marketplace.push(newListing);
    
    res.json({
        success: true,
        listing: newListing,
        message: 'Token listed successfully'
    });
});

app.post('/api/marketplace/buy', (req, res) => {
    const { listingId, buyer } = req.body;
    
    const listing = mockDB.marketplace.find(l => l.id === listingId);
    
    if (!listing || !listing.active) {
        return res.status(404).json({ error: 'Listing not found or not active' });
    }
    
    listing.active = false;
    
    res.json({
        success: true,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        tokenId: listing.tokenId,
        price: listing.price,
        seller: listing.seller,
        buyer: buyer,
        message: 'Token purchased successfully'
    });
});

// Price data routes
app.get('/api/prices/current', (req, res) => {
    const latest = mockDB.priceHistory[mockDB.priceHistory.length - 1];
    
    res.json({
        timestamp: new Date().toISOString(),
        ethPrice: latest.ethPrice,
        maticPrice: latest.maticPrice,
        source: 'Chainlink Price Feeds'
    });
});

app.get('/api/prices/history', (req, res) => {
    const { days = 7 } = req.query;
    const history = mockDB.priceHistory.slice(-parseInt(days));
    
    res.json({
        history: history,
        period: `${days} days`
    });
});

// Cross-chain routes
app.get('/api/crosschain/supported', (req, res) => {
    res.json({
        supportedChains: [
            { chainId: 1, name: 'Ethereum', symbol: 'ETH', active: true },
            { chainId: 137, name: 'Polygon', symbol: 'MATIC', active: true },
            { chainId: 11155111, name: 'Sepolia', symbol: 'ETH', active: true },
            { chainId: 80001, name: 'Mumbai', symbol: 'MATIC', active: true }
        ]
    });
});

app.post('/api/crosschain/transfer', (req, res) => {
    const { tokenId, fromChain, toChain, recipient } = req.body;
    
    // Mock cross-chain transfer
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

// Analytics routes
app.get('/api/analytics/platform', (req, res) => {
    res.json({
        totalProperties: mockDB.properties.length,
        totalTokens: mockDB.properties.reduce((sum, p) => sum + p.mintedTokens, 0),
        totalValue: mockDB.properties.reduce((sum, p) => sum + p.totalValue, 0),
        totalSuppliedToAave: mockDB.properties.reduce((sum, p) => sum + p.aaveStats.totalSupplied, 0),
        totalBorrowedFromAave: mockDB.properties.reduce((sum, p) => sum + p.aaveStats.totalBorrowed, 0),
        totalYieldDistributed: mockDB.properties.reduce((sum, p) => sum + p.aaveStats.totalYieldDistributed, 0),
        averageAPY: 5.0,
        activeListings: mockDB.marketplace.filter(l => l.active).length
    });
});

// Liquidation routes
app.get('/api/liquidation/risks', (req, res) => {
    // Mock liquidation risk data
    res.json({
        atRiskPositions: [
            {
                address: "0xabcd...1234",
                healthFactor: 78,
                collateralValue: 50000,
                borrowedAmount: 42000,
                liquidationThreshold: 40000,
                timeToLiquidation: "2 hours"
            }
        ],
        totalAtRisk: 1,
        averageHealthFactor: 85
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        message: 'The requested endpoint does not exist'
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`
🚀 Lotwise API Server Started
==================================
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
📊 Features: Fractional ownership, Aave integration, Cross-chain support
🔗 Health Check: http://localhost:${PORT}/health
📖 Endpoints:
   - Properties: /api/properties
   - Users: /api/users/:address
   - Aave: /api/aave/*
   - Yield: /api/yield/*
   - Marketplace: /api/marketplace
   - Cross-chain: /api/crosschain/*
   - Analytics: /api/analytics/*
==================================
    `);
});

module.exports = app;
