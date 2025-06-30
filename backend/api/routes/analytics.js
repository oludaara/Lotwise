const express = require('express');
const router = express.Router();

module.exports = ({ Property, Marketplace, User }) => {
    // GET /api/analytics/platform
    router.get('/platform', async (req, res) => {
        try {
            const properties = await Property.find({});
            const marketplace = await Marketplace.find({ active: true });
            const users = await User.find({});

            // Calculate comprehensive analytics
            const totalProperties = properties.length;
            const totalTokens = properties.reduce((sum, p) => sum + (p.mintedTokens || 0), 0);
            const totalValue = properties.reduce((sum, p) => sum + (p.totalValue || 0), 0);
            const totalSuppliedToAave = properties.reduce((sum, p) => sum + ((p.aaveStats && p.aaveStats.totalSupplied) || 0), 0);
            const totalBorrowedFromAave = properties.reduce((sum, p) => sum + ((p.aaveStats && p.aaveStats.totalBorrowed) || 0), 0);
            const totalYieldDistributed = properties.reduce((sum, p) => sum + ((p.aaveStats && p.aaveStats.totalYieldDistributed) || 0), 0);
            const averageAPY = properties.length ? (properties.reduce((sum, p) => sum + ((p.aaveStats && p.aaveStats.averageAPY) || 0), 0) / properties.length) : 0;
            const activeListings = marketplace.length;
            const totalUsers = users.length;

            // Real-time metrics
            const verifiedProperties = properties.filter(p => p.verified).length;
            const averageHealthFactor = users.length ? (users.reduce((sum, u) => sum + (u.healthFactor || 100), 0) / users.length) : 100;
            const atRiskUsers = users.filter(u => (u.healthFactor || 100) < 80).length;

            res.json({
                // Basic metrics
                totalProperties,
                totalTokens,
                totalValue,
                totalSuppliedToAave,
                totalBorrowedFromAave,
                totalYieldDistributed,
                averageAPY,
                activeListings,
                totalUsers,

                // Real-time metrics
                verifiedProperties,
                verificationRate: totalProperties > 0 ? (verifiedProperties / totalProperties * 100).toFixed(2) : 0,
                averageHealthFactor: averageHealthFactor.toFixed(2),
                atRiskUsers,
                riskPercentage: totalUsers > 0 ? (atRiskUsers / totalUsers * 100).toFixed(2) : 0,

                // Performance metrics
                totalMarketCap: totalValue,
                averagePropertyValue: totalProperties > 0 ? (totalValue / totalProperties).toFixed(2) : 0,
                averageTokensPerProperty: totalProperties > 0 ? (totalTokens / totalProperties).toFixed(2) : 0,

                // DeFi metrics
                utilizationRate: totalSuppliedToAave > 0 ? (totalBorrowedFromAave / totalSuppliedToAave * 100).toFixed(2) : 0,
                totalYieldGenerated: totalYieldDistributed,
                averageYieldPerProperty: totalProperties > 0 ? (totalYieldDistributed / totalProperties).toFixed(2) : 0,

                // Marketplace metrics
                activeListings,
                averageListingPrice: activeListings > 0 ? (marketplace.reduce((sum, m) => sum + (m.price || 0), 0) / activeListings).toFixed(2) : 0,

                // Timestamp
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch analytics data' });
        }
    });

    // GET /api/analytics/real-time
    router.get('/real-time', async (req, res) => {
        try {
            const properties = await Property.find({});
            const users = await User.find({});

            // Real-time monitoring data
            const realTimeData = {
                // System health
                systemStatus: 'healthy',
                uptime: process.uptime(),

                // Active transactions
                activeTransfers: Math.floor(Math.random() * 10) + 1, // Mock data
                pendingVerifications: Math.floor(Math.random() * 5),

                // Risk monitoring
                highRiskPositions: users.filter(u => (u.healthFactor || 100) < 70).length,
                mediumRiskPositions: users.filter(u => (u.healthFactor || 100) >= 70 && (u.healthFactor || 100) < 85).length,
                lowRiskPositions: users.filter(u => (u.healthFactor || 100) >= 85).length,

                // Performance indicators
                averageResponseTime: Math.floor(Math.random() * 100) + 50, // Mock data
                errorRate: (Math.random() * 0.1).toFixed(4),

                // Market indicators
                priceVolatility: (Math.random() * 5).toFixed(2),
                tradingVolume: Math.floor(Math.random() * 1000000) + 100000,

                timestamp: new Date().toISOString()
            };

            res.json(realTimeData);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch real-time data' });
        }
    });

    // GET /api/analytics/performance
    router.get('/performance', async (req, res) => {
        try {
            const properties = await Property.find({});

            // Performance analytics
            const performanceData = {
                // Yield performance
                totalYieldGenerated: properties.reduce((sum, p) => sum + ((p.aaveStats && p.aaveStats.totalYieldDistributed) || 0), 0),
                averageYieldPerToken: properties.reduce((sum, p) => sum + (p.mintedTokens || 0), 0) > 0 ?
                    (properties.reduce((sum, p) => sum + ((p.aaveStats && p.aaveStats.totalYieldDistributed) || 0), 0) /
                        properties.reduce((sum, p) => sum + (p.mintedTokens || 0), 0)).toFixed(4) : 0,

                // Property performance
                topPerformingProperties: properties
                    .sort((a, b) => ((b.aaveStats && b.aaveStats.averageAPY) || 0) - ((a.aaveStats && a.aaveStats.averageAPY) || 0))
                    .slice(0, 5)
                    .map(p => ({
                        id: p.id,
                        address: p.address,
                        apy: (p.aaveStats && p.aaveStats.averageAPY) || 0,
                        totalYield: (p.aaveStats && p.aaveStats.totalYieldDistributed) || 0
                    })),

                // User performance
                averageUserPortfolioValue: properties.reduce((sum, p) => sum + (p.totalValue || 0), 0) / Math.max(properties.length, 1),
                averageTokensPerUser: properties.reduce((sum, p) => sum + (p.mintedTokens || 0), 0) / Math.max(properties.length, 1),

                // Market performance
                totalMarketCap: properties.reduce((sum, p) => sum + (p.totalValue || 0), 0),
                averagePropertyValue: properties.reduce((sum, p) => sum + (p.totalValue || 0), 0) / Math.max(properties.length, 1),

                timestamp: new Date().toISOString()
            };

            res.json(performanceData);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch performance data' });
        }
    });

    // GET /api/analytics/risk
    router.get('/risk', async (req, res) => {
        try {
            const users = await User.find({});

            // Risk analytics
            const riskData = {
                // Health factor distribution
                healthFactorDistribution: {
                    excellent: users.filter(u => (u.healthFactor || 100) >= 90).length,
                    good: users.filter(u => (u.healthFactor || 100) >= 80 && (u.healthFactor || 100) < 90).length,
                    fair: users.filter(u => (u.healthFactor || 100) >= 70 && (u.healthFactor || 100) < 80).length,
                    poor: users.filter(u => (u.healthFactor || 100) >= 60 && (u.healthFactor || 100) < 70).length,
                    critical: users.filter(u => (u.healthFactor || 100) < 60).length
                },

                // Risk metrics
                totalAtRisk: users.filter(u => (u.healthFactor || 100) < 80).length,
                averageHealthFactor: users.length ? (users.reduce((sum, u) => sum + (u.healthFactor || 100), 0) / users.length).toFixed(2) : 100,
                riskPercentage: users.length ? (users.filter(u => (u.healthFactor || 100) < 80).length / users.length * 100).toFixed(2) : 0,

                // Liquidation risk
                liquidationRisk: {
                    high: users.filter(u => (u.healthFactor || 100) < 70).length,
                    medium: users.filter(u => (u.healthFactor || 100) >= 70 && (u.healthFactor || 100) < 80).length,
                    low: users.filter(u => (u.healthFactor || 100) >= 80).length
                },

                // Portfolio concentration
                averagePortfolioConcentration: users.length ?
                    (users.reduce((sum, u) => sum + (u.portfolioValue || 0), 0) / users.length).toFixed(2) : 0,

                timestamp: new Date().toISOString()
            };

            res.json(riskData);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch risk data' });
        }
    });

    return router;
}; 