require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const DatabaseConnection = require('./database/connection');

// Import models
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

// Database connection
DatabaseConnection.connect()
    .then(() => {
        console.log('[Lotwise] Database connected successfully!');
    })
    .catch(err => {
        console.error('[Lotwise] Database connection error:', err.message);
        console.log('📘 Server will continue running without database features');
        // Don't exit - allow server to run for testing wallet endpoints
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
app.use('/api/wallet', walletRouter);

// Health check
app.get('/health', async (req, res) => {
    try {
        const dbStatus = DatabaseConnection.getConnectionStatus();
        const dbHealthy = await DatabaseConnection.healthCheck();
        
        res.json({
            status: dbHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            database: {
                connected: dbStatus.isConnected,
                healthy: dbHealthy,
                name: dbStatus.name || 'N/A'
            },
            features: [
                'Fractional Ownership',
                'Aave Integration',
                'Cross-chain Support',
                'Yield Distribution',
                'Liquidation Management',
                'Database Integration',
                'Multi-Chain Wallet Connection',
                'CCIP Cross-Chain Transfers'
            ]
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            error: error.message
        });
    }
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
    console.log(`\n🚀 Lotwise API Server Started\n==================================\n📍 Port: ${PORT}\n🌐 Environment: ${process.env.NODE_ENV || 'development'}\n📊 Features: Fractional ownership, Aave integration, Cross-chain support\n🔗 Health Check: http://localhost:${PORT}/health\n📖 Endpoints:\n   - Properties: /api/properties\n   - Users: /api/users/:address\n   - Aave: /api/aave/*\n   - Yield: /api/yield/*\n   - Marketplace: /api/marketplace\n   - Cross-chain: /api/crosschain/*\n   - Analytics: /api/analytics/*\n   - Wallet: /api/wallet/* (NEW!)\n🔗 Multi-Chain Support:\n   - Ethereum Sepolia (Testnet)\n   - Polygon Mumbai (Testnet)\n   - Avalanche Fuji (Testnet)\n   - CCIP Cross-Chain Transfers\n==================================\n    `);
});

module.exports = app;
