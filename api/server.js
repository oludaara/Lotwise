require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const mongoose = require('mongoose');
const User = require('./models/User');
const Property = require('./models/Property');
const Marketplace = require('./models/Marketplace');
const PriceHistory = require('./models/PriceHistory');

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

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Lotwise API Documentation'
}));

// Redirect root to API documentation
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI;
console.log('[Lotwise] Connecting to MongoDB:', MONGO_URI);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('[Lotwise] MongoDB connected successfully!'))
    .catch(err => {
        console.error('[Lotwise] MongoDB connection error:', err);
        process.exit(1);
    });

// Import routers
const authRouter = require('./routes/auth')({ User });
const propertiesRouter = require('./routes/properties')({ Property });
const usersRouter = require('./routes/users')({ User }, (req, res, next) => next());
const aaveRouter = require('./routes/aave')({ User });
const yieldRouter = require('./routes/yield')({ Property });
const marketplaceRouter = require('./routes/marketplace')({ Marketplace });
const pricesRouter = require('./routes/prices')({ PriceHistory });
const crosschainRouter = require('./routes/crosschain')({});
const analyticsRouter = require('./routes/analytics')({ Property, Marketplace });
const liquidationRouter = require('./routes/liquidation')({ User });
const functionsRouter = require('./routes/functions')({ Property });
const walletRouter = require('./routes/wallet')({ User });

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/users', usersRouter);
app.use('/api/aave', aaveRouter);
app.use('/api/yield', yieldRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/crosschain', crosschainRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/liquidation', liquidationRouter);
app.use('/api/functions', functionsRouter);
app.use('/api/wallet', walletRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: [
            'Fractional Ownership',
            'Aave Integration',
            'Cross-chain Support (ETH, Polygon, AVAX)',
            'Yield Distribution',
            'Liquidation Management',
            'Chainlink Functions Verification',
            'Real-time Analytics',
            'Enhanced Risk Monitoring'
        ]
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
    console.log(`\n🚀 Lotwise API Server Started\n==================================\n📍 Port: ${PORT}\n🌐 Environment: ${process.env.NODE_ENV || 'development'}\n📊 Features: Fractional ownership, Aave integration, Cross-chain support\n🔗 Health Check: http://localhost:${PORT}/health\n📖 Endpoints:\n   - Properties: /api/properties\n   - Users: /api/users/:address\n   - Aave: /api/aave/*\n   - Yield: /api/yield/*\n   - Marketplace: /api/marketplace\n   - Cross-chain: /api/crosschain/*\n   - Analytics: /api/analytics/*\n   - Liquidation: /api/liquidation/*\n   - Functions: /api/functions/*\n==================================\n    `);
});

module.exports = app;
