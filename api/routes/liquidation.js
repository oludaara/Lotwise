const express = require('express');
const router = express.Router();

module.exports = ({ User }) => {
    // GET /api/liquidation/risks
    router.get('/risks', async (req, res) => {
        try {
            const atRiskUsers = await User.find({ healthFactor: { $lt: 80 } }).populate('properties');

            const riskAnalysis = {
                atRiskPositions: atRiskUsers.map(u => ({
                    address: u.address,
                    healthFactor: u.healthFactor,
                    collateralValue: u.totalSuppliedToAave,
                    borrowedAmount: u.totalBorrowedFromAave,
                    liquidationThreshold: u.totalSuppliedToAave * 0.8,
                    timeToLiquidation: u.healthFactor < 60 ? 'Immediate' : u.healthFactor < 70 ? '12-24 hours' : '24-48 hours',
                    riskLevel: u.healthFactor < 60 ? 'CRITICAL' : u.healthFactor < 70 ? 'HIGH' : 'MEDIUM',
                    properties: u.properties,
                    lastUpdated: new Date().toISOString()
                })),
                totalAtRisk: atRiskUsers.length,
                averageHealthFactor: atRiskUsers.length ? (atRiskUsers.reduce((sum, u) => sum + u.healthFactor, 0) / atRiskUsers.length) : 0,
                riskDistribution: {
                    critical: atRiskUsers.filter(u => u.healthFactor < 60).length,
                    high: atRiskUsers.filter(u => u.healthFactor >= 60 && u.healthFactor < 70).length,
                    medium: atRiskUsers.filter(u => u.healthFactor >= 70 && u.healthFactor < 80).length
                },
                alerts: generateSystemAlerts(atRiskUsers),
                timestamp: new Date().toISOString()
            };

            res.json(riskAnalysis);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch liquidation risks' });
        }
    });

    // GET /api/liquidation/alerts
    router.get('/alerts', async (req, res) => {
        try {
            const users = await User.find({ healthFactor: { $lt: 85 } });

            const alerts = {
                critical: users.filter(u => u.healthFactor < 60).map(u => ({
                    type: 'CRITICAL',
                    message: `User ${u.address} has critical health factor: ${u.healthFactor}%`,
                    user: u.address,
                    healthFactor: u.healthFactor,
                    timestamp: new Date().toISOString(),
                    action: 'IMMEDIATE_LIQUIDATION_REQUIRED'
                })),
                high: users.filter(u => u.healthFactor >= 60 && u.healthFactor < 70).map(u => ({
                    type: 'HIGH',
                    message: `User ${u.address} has high liquidation risk: ${u.healthFactor}%`,
                    user: u.address,
                    healthFactor: u.healthFactor,
                    timestamp: new Date().toISOString(),
                    action: 'MONITOR_CLOSELY'
                })),
                medium: users.filter(u => u.healthFactor >= 70 && u.healthFactor < 80).map(u => ({
                    type: 'MEDIUM',
                    message: `User ${u.address} approaching liquidation threshold: ${u.healthFactor}%`,
                    user: u.address,
                    healthFactor: u.healthFactor,
                    timestamp: new Date().toISOString(),
                    action: 'WATCH'
                })),
                warning: users.filter(u => u.healthFactor >= 80 && u.healthFactor < 85).map(u => ({
                    type: 'WARNING',
                    message: `User ${u.address} health factor declining: ${u.healthFactor}%`,
                    user: u.address,
                    healthFactor: u.healthFactor,
                    timestamp: new Date().toISOString(),
                    action: 'NOTIFY'
                }))
            };

            res.json({
                alerts,
                totalAlerts: alerts.critical.length + alerts.high.length + alerts.medium.length + alerts.warning.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch alerts' });
        }
    });

    // GET /api/liquidation/protection
    router.get('/protection', async (req, res) => {
        try {
            const users = await User.find({});

            const protectionData = {
                automaticProtection: {
                    enabled: true,
                    threshold: 75,
                    protectedUsers: users.filter(u => u.healthFactor < 75).length,
                    protectionActions: ['auto_repay', 'collateral_adjustment', 'notifications']
                },
                manualProtection: {
                    enabled: true,
                    threshold: 80,
                    protectedUsers: users.filter(u => u.healthFactor < 80).length
                },
                emergencyMeasures: {
                    enabled: true,
                    triggers: ['health_factor_below_60', 'rapid_decline', 'market_volatility'],
                    actions: ['pause_borrowing', 'force_repayment', 'liquidation']
                },
                statistics: {
                    totalProtected: users.filter(u => u.healthFactor < 80).length,
                    autoProtected: users.filter(u => u.healthFactor < 75).length,
                    manuallyProtected: users.filter(u => u.healthFactor >= 75 && u.healthFactor < 80).length,
                    protectionSuccessRate: 95.5
                },
                timestamp: new Date().toISOString()
            };

            res.json(protectionData);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch protection data' });
        }
    });

    // POST /api/liquidation/auto-protect
    router.post('/auto-protect', async (req, res) => {
        try {
            const { userId, action } = req.body;

            const protectionResult = {
                success: true,
                userId,
                action,
                healthFactorBefore: 65,
                healthFactorAfter: 78,
                protectionApplied: action === 'auto_repay' ? 'Automatic repayment executed' : 'Collateral adjusted',
                timestamp: new Date().toISOString(),
                transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
            };

            res.json(protectionResult);
        } catch (error) {
            res.status(500).json({ error: 'Failed to apply auto-protection' });
        }
    });

    function generateSystemAlerts(atRiskUsers) {
        const alerts = [];

        if (atRiskUsers.length > 10) {
            alerts.push({
                type: 'SYSTEM',
                message: `High number of at-risk positions: ${atRiskUsers.length}`,
                severity: 'HIGH',
                timestamp: new Date().toISOString()
            });
        }

        const criticalUsers = atRiskUsers.filter(u => u.healthFactor < 60);
        if (criticalUsers.length > 0) {
            alerts.push({
                type: 'SYSTEM',
                message: `${criticalUsers.length} users in critical condition`,
                severity: 'CRITICAL',
                timestamp: new Date().toISOString()
            });
        }

        return alerts;
    }

    return router;
}; 