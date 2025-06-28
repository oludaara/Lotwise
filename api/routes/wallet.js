const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

module.exports = ({ User }) => {
    // POST /api/wallet/connect
    router.post('/connect', async (req, res) => {
        try {
            const { address, signature, message } = req.body;

            if (!address || !signature || !message) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            // Verify the signature
            const recoveredAddress = ethers.verifyMessage(message, signature);

            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                return res.status(401).json({ error: 'Invalid signature' });
            }

            // Check if user exists, create if not
            let user = await User.findOne({ address: address.toLowerCase() });

            if (!user) {
                user = new User({
                    address: address.toLowerCase(),
                    walletConnected: true,
                    lastConnection: new Date(),
                    connectionCount: 1
                });
            } else {
                user.walletConnected = true;
                user.lastConnection = new Date();
                user.connectionCount += 1;
            }

            await user.save();

            res.json({
                success: true,
                address: address,
                user: {
                    address: user.address,
                    walletConnected: user.walletConnected,
                    lastConnection: user.lastConnection,
                    connectionCount: user.connectionCount
                },
                message: 'Wallet connected successfully'
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to connect wallet' });
        }
    });

    // POST /api/wallet/disconnect
    router.post('/disconnect', async (req, res) => {
        try {
            const { address } = req.body;

            if (!address) {
                return res.status(400).json({ error: 'Address required' });
            }

            const user = await User.findOne({ address: address.toLowerCase() });

            if (user) {
                user.walletConnected = false;
                await user.save();
            }

            res.json({
                success: true,
                message: 'Wallet disconnected successfully'
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to disconnect wallet' });
        }
    });

    // GET /api/wallet/status/:address
    router.get('/status/:address', async (req, res) => {
        try {
            const { address } = req.params;

            const user = await User.findOne({ address: address.toLowerCase() });

            res.json({
                address: address,
                connected: user ? user.walletConnected : false,
                lastConnection: user ? user.lastConnection : null,
                connectionCount: user ? user.connectionCount : 0
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get wallet status' });
        }
    });

    // POST /api/wallet/sign-message
    router.post('/sign-message', async (req, res) => {
        try {
            const { address } = req.body;

            if (!address) {
                return res.status(400).json({ error: 'Address required' });
            }

            // Generate a unique message for signing
            const timestamp = Date.now();
            const message = `Connect to Lotwise\n\nAddress: ${address}\nTimestamp: ${timestamp}\n\nThis signature is used to verify wallet ownership.`;

            res.json({
                message: message,
                timestamp: timestamp,
                address: address
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to generate message' });
        }
    });

    // GET /api/wallet/balance/:address
    router.get('/balance/:address', async (req, res) => {
        try {
            const { address } = req.params;

            // This would typically connect to a blockchain provider
            // For now, return mock data
            const balance = {
                eth: "0.5",
                usdc: "1000",
                tokens: [
                    { symbol: "LFP", balance: "150", propertyId: "1" },
                    { symbol: "LFP", balance: "75", propertyId: "2" }
                ]
            };

            res.json({
                address: address,
                balance: balance
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get balance' });
        }
    });

    return router;
}; 