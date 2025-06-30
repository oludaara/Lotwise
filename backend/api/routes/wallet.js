const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

// Network configurations for testnets (CCIP enabled)
const SUPPORTED_NETWORKS = {
    11155111: {
        chainId: 11155111,
        name: 'Sepolia',
        symbol: 'ETH',
        network: 'testnet',
        rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/ipdedLl0wIygq5b-DGbyYVKnI5MzW0v4',
        blockExplorer: 'https://sepolia.etherscan.io',
        ccipSelector: '16015286601757825753',
        faucets: [
            'https://sepoliafaucet.com/',
            'https://faucets.chain.link/sepolia'
        ],
        lotwise: {
            contractAddress: process.env.SEPOLIA_CONTRACT_ADDRESS || '',
            deployed: false
        }
    },
    80001: {
        chainId: 80001,
        name: 'Mumbai',
        symbol: 'MATIC',
        network: 'testnet',
        rpcUrl: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
        blockExplorer: 'https://mumbai.polygonscan.com',
        ccipSelector: '12532609583862916517',
        faucets: [
            'https://faucet.polygon.technology/',
            'https://faucets.chain.link/mumbai'
        ],
        lotwise: {
            contractAddress: process.env.MUMBAI_CONTRACT_ADDRESS || '',
            deployed: false
        }
    },
    43113: {
        chainId: 43113,
        name: 'Avalanche Fuji',
        symbol: 'AVAX',
        network: 'testnet',
        rpcUrl: process.env.FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
        blockExplorer: 'https://testnet.snowtrace.io',
        ccipSelector: '14767482510784806043',
        faucets: [
            'https://faucet.avax.network/',
            'https://faucets.chain.link/fuji'
        ],
        lotwise: {
            contractAddress: process.env.FUJI_CONTRACT_ADDRESS || '',
            deployed: false
        }
    }
};

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
