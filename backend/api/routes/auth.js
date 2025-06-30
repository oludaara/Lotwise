const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

module.exports = ({ User }) => {
    // In-memory nonce store (for demo; use Redis or DB in production)
    const nonces = {};

    // POST /api/auth/nonce
    router.post('/nonce', (req, res) => {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }
        const nonce = Math.floor(Math.random() * 1000000).toString();
        nonces[address.toLowerCase()] = nonce;
        res.json({
            nonce,
            message: `Welcome to Lotwise! Please sign this message to verify your wallet ownership. Nonce: ${nonce}`
        });
    });

    // POST /api/auth/verify
    router.post('/verify', async (req, res) => {
        const { address, signature } = req.body;
        if (!address || !signature) {
            return res.status(400).json({ error: 'Address and signature are required' });
        }
        try {
            const nonce = nonces[address.toLowerCase()];
            if (!nonce) {
                return res.status(400).json({ error: 'Please request a new nonce' });
            }
            const message = `Welcome to Lotwise! Please sign this message to verify your wallet ownership. Nonce: ${nonce}`;
            const recoveredAddress = ethers.verifyMessage(message, signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                return res.status(401).json({ error: 'Invalid signature' });
            }
            delete nonces[address.toLowerCase()];
            let user = await User.findOne({ address: address.toLowerCase() });
            if (!user) {
                user = await User.create({ address: address.toLowerCase() });
            } else {
                user.lastLogin = new Date();
                await user.save();
            }
            res.json({
                success: true,
                user,
                token: 'mock_jwt_token'
            });
        } catch (error) {
            console.error('Authentication error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    });

    return router;
}; 