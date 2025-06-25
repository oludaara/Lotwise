const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

module.exports = ({ User }) => {
    // Network configurations for testnets (CCIP enabled)
    const SUPPORTED_NETWORKS = {
        // Ethereum Sepolia Testnet
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
        // Polygon Mumbai Testnet  
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
        // Avalanche Fuji Testnet
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

    // In-memory session store (use Redis in production)
    const walletSessions = {};
    const networkSwitchRequests = {};

    /**
     * @swagger
     * /api/wallet/networks:
     *   get:
     *     summary: Get supported networks for wallet connection
     *     tags: [Wallet]
     *     responses:
     *       200:
     *         description: List of supported networks with CCIP capabilities
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 networks:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       chainId:
     *                         type: number
     *                         example: 11155111
     *                       name:
     *                         type: string
     *                         example: "Sepolia"
     *                       symbol:
     *                         type: string
     *                         example: "ETH"
     *                       rpcUrl:
     *                         type: string
     *                       ccipEnabled:
     *                         type: boolean
     *                       faucets:
     *                         type: array
     *                         items:
     *                           type: string
     */
    router.get('/networks', (req, res) => {
        const networks = Object.values(SUPPORTED_NETWORKS).map(network => ({
            chainId: network.chainId,
            name: network.name,
            symbol: network.symbol,
            network: network.network,
            rpcUrl: network.rpcUrl,
            blockExplorer: network.blockExplorer,
            ccipEnabled: true,
            ccipSelector: network.ccipSelector,
            faucets: network.faucets,
            lotwise: {
                contractAddress: network.lotwise.contractAddress,
                deployed: !!network.lotwise.contractAddress
            }
        }));

        res.json({
            networks,
            recommendedTestnet: 11155111, // Sepolia
            ccipSupported: true,
            totalNetworks: networks.length
        });
    });

    /**
     * @swagger
     * /api/wallet/connect:
     *   post:
     *     summary: Connect wallet and initialize session
     *     tags: [Wallet]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [address, chainId, signature]
     *             properties:
     *               address:
     *                 type: string
     *                 pattern: "^0x[a-fA-F0-9]{40}$"
     *                 example: "0x1234567890abcdef1234567890abcdef12345678"
     *               chainId:
     *                 type: number
     *                 example: 11155111
     *               signature:
     *                 type: string
     *                 example: "0x..."
     *               message:
     *                 type: string
     *                 example: "Sign to connect to Lotwise"
     */
    router.post('/connect', async (req, res) => {
        try {
            const { address, chainId, signature, message } = req.body;

            if (!address || !chainId || !signature) {
                return res.status(400).json({ 
                    error: 'Missing required fields: address, chainId, signature' 
                });
            }

            // Validate network support
            const network = SUPPORTED_NETWORKS[chainId];
            if (!network) {
                return res.status(400).json({ 
                    error: 'Unsupported network',
                    supportedNetworks: Object.keys(SUPPORTED_NETWORKS).map(Number)
                });
            }

            // Verify signature (basic implementation)
            try {
                const recoveredAddress = ethers.verifyMessage(message || `Connect to Lotwise on ${network.name}`, signature);
                if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                    return res.status(401).json({ error: 'Invalid signature' });
                }
            } catch (error) {
                return res.status(401).json({ error: 'Signature verification failed' });
            }

            // Create or update user
            let user = await User.findOne({ address: address.toLowerCase() });
            if (!user) {
                user = await User.create({ 
                    address: address.toLowerCase(),
                    connectedNetworks: [chainId],
                    currentNetwork: chainId,
                    lastLogin: new Date()
                });
            } else {
                if (!user.connectedNetworks.includes(chainId)) {
                    user.connectedNetworks.push(chainId);
                }
                user.currentNetwork = chainId;
                user.lastLogin = new Date();
                await user.save();
            }

            // Create wallet session
            const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
            walletSessions[sessionId] = {
                address: address.toLowerCase(),
                chainId,
                network: network.name,
                connectedAt: new Date(),
                lastActivity: new Date()
            };

            // Get wallet balance
            let balance = '0';
            try {
                const provider = new ethers.JsonRpcProvider(network.rpcUrl);
                const balanceWei = await provider.getBalance(address);
                balance = ethers.formatEther(balanceWei);
            } catch (error) {
                console.log('Could not fetch balance:', error.message);
            }

            res.json({
                success: true,
                sessionId,
                user: {
                    address: user.address,
                    connectedNetworks: user.connectedNetworks,
                    currentNetwork: user.currentNetwork,
                    totalTokens: user.totalTokens || 0,
                    portfolioValue: user.portfolioValue || 0
                },
                wallet: {
                    address,
                    balance,
                    network: network.name,
                    chainId,
                    symbol: network.symbol
                },
                network: {
                    name: network.name,
                    chainId: network.chainId,
                    symbol: network.symbol,
                    blockExplorer: network.blockExplorer,
                    ccipEnabled: true,
                    lotwise: network.lotwise
                },
                message: `Successfully connected to ${network.name} testnet!`
            });

        } catch (error) {
            console.error('Wallet connection error:', error);
            res.status(500).json({ 
                error: 'Connection failed', 
                details: error.message 
            });
        }
    });

    /**
     * @swagger
     * /api/wallet/switch-network:
     *   post:
     *     summary: Switch to a different supported network using CCIP
     *     tags: [Wallet]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [sessionId, targetChainId]
     *             properties:
     *               sessionId:
     *                 type: string
     *                 example: "session_abc123"
     *               targetChainId:
     *                 type: number
     *                 example: 80001
     *               transferTokens:
     *                 type: boolean
     *                 default: false
     *                 description: "Whether to transfer tokens via CCIP"
     *               tokenIds:
     *                 type: array
     *                 items:
     *                   type: number
     *                 description: "Token IDs to transfer (if transferTokens is true)"
     */
    router.post('/switch-network', async (req, res) => {
        try {
            const { sessionId, targetChainId, transferTokens = false, tokenIds = [] } = req.body;

            if (!sessionId || !targetChainId) {
                return res.status(400).json({ 
                    error: 'Missing required fields: sessionId, targetChainId' 
                });
            }

            // Validate session
            const session = walletSessions[sessionId];
            if (!session) {
                return res.status(401).json({ error: 'Invalid or expired session' });
            }

            // Validate target network
            const targetNetwork = SUPPORTED_NETWORKS[targetChainId];
            const currentNetwork = SUPPORTED_NETWORKS[session.chainId];
            
            if (!targetNetwork) {
                return res.status(400).json({ 
                    error: 'Unsupported target network',
                    supportedNetworks: Object.keys(SUPPORTED_NETWORKS).map(Number)
                });
            }

            if (session.chainId === targetChainId) {
                return res.status(400).json({ 
                    error: 'Already connected to target network' 
                });
            }

            // Create network switch request
            const switchRequestId = 'switch_' + Math.random().toString(36).substr(2, 9);
            networkSwitchRequests[switchRequestId] = {
                sessionId,
                fromChainId: session.chainId,
                toChainId: targetChainId,
                transferTokens,
                tokenIds,
                status: 'pending',
                createdAt: new Date()
            };

            // Update session
            session.chainId = targetChainId;
            session.network = targetNetwork.name;
            session.lastActivity = new Date();

            // Update user's current network
            const user = await User.findOne({ address: session.address });
            if (user) {
                if (!user.connectedNetworks.includes(targetChainId)) {
                    user.connectedNetworks.push(targetChainId);
                }
                user.currentNetwork = targetChainId;
                await user.save();
            }

            const response = {
                success: true,
                switchRequestId,
                fromNetwork: {
                    name: currentNetwork.name,
                    chainId: currentNetwork.chainId,
                    symbol: currentNetwork.symbol
                },
                toNetwork: {
                    name: targetNetwork.name,
                    chainId: targetNetwork.chainId,
                    symbol: targetNetwork.symbol,
                    rpcUrl: targetNetwork.rpcUrl,
                    blockExplorer: targetNetwork.blockExplorer
                },
                ccip: {
                    enabled: true,
                    fromSelector: currentNetwork.ccipSelector,
                    toSelector: targetNetwork.ccipSelector,
                    estimatedTime: transferTokens ? '10-15 minutes' : 'Instant'
                },
                message: `Switching from ${currentNetwork.name} to ${targetNetwork.name}`
            };

            // If transferring tokens, add CCIP transfer details
            if (transferTokens && tokenIds.length > 0) {
                response.ccipTransfer = {
                    tokenIds,
                    estimatedFee: '0.01 LINK',
                    estimatedTime: '10-15 minutes',
                    status: 'initiated'
                };
            }

            // Add faucet information for new network
            if (targetNetwork.faucets.length > 0) {
                response.faucets = {
                    message: `Get ${targetNetwork.symbol} for gas fees`,
                    urls: targetNetwork.faucets
                };
            }

            res.json(response);

        } catch (error) {
            console.error('Network switch error:', error);
            res.status(500).json({ 
                error: 'Network switch failed', 
                details: error.message 
            });
        }
    });

    /**
     * @swagger
     * /api/wallet/session/{sessionId}:
     *   get:
     *     summary: Get current wallet session information
     *     tags: [Wallet]
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: string
     */
    router.get('/session/:sessionId', async (req, res) => {
        try {
            const { sessionId } = req.params;
            const session = walletSessions[sessionId];

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const network = SUPPORTED_NETWORKS[session.chainId];
            
            // Get user data
            const user = await User.findOne({ address: session.address });
            
            // Get current balance
            let balance = '0';
            try {
                const provider = new ethers.JsonRpcProvider(network.rpcUrl);
                const balanceWei = await provider.getBalance(session.address);
                balance = ethers.formatEther(balanceWei);
            } catch (error) {
                console.log('Could not fetch balance:', error.message);
            }

            res.json({
                session: {
                    sessionId,
                    address: session.address,
                    connectedAt: session.connectedAt,
                    lastActivity: session.lastActivity,
                    active: true
                },
                wallet: {
                    address: session.address,
                    balance,
                    network: network.name,
                    chainId: session.chainId,
                    symbol: network.symbol
                },
                user: user ? {
                    address: user.address,
                    connectedNetworks: user.connectedNetworks,
                    currentNetwork: user.currentNetwork,
                    totalTokens: user.totalTokens || 0,
                    portfolioValue: user.portfolioValue || 0,
                    lastLogin: user.lastLogin
                } : null,
                network: {
                    name: network.name,
                    chainId: network.chainId,
                    symbol: network.symbol,
                    blockExplorer: network.blockExplorer,
                    ccipEnabled: true,
                    lotwise: network.lotwise,
                    faucets: network.faucets
                }
            });

        } catch (error) {
            console.error('Session fetch error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch session', 
                details: error.message 
            });
        }
    });

    /**
     * @swagger
     * /api/wallet/disconnect:
     *   post:
     *     summary: Disconnect wallet and clear session
     *     tags: [Wallet]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [sessionId]
     *             properties:
     *               sessionId:
     *                 type: string
     */
    router.post('/disconnect', (req, res) => {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const session = walletSessions[sessionId];
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Clear session
        delete walletSessions[sessionId];

        res.json({
            success: true,
            message: 'Wallet disconnected successfully'
        });
    });

    /**
     * @swagger
     * /api/wallet/ccip/estimate-fee:
     *   post:
     *     summary: Estimate CCIP transfer fee for cross-chain token transfer
     *     tags: [Wallet]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [fromChainId, toChainId, tokenIds]
     *             properties:
     *               fromChainId:
     *                 type: number
     *                 example: 11155111
     *               toChainId:
     *                 type: number
     *                 example: 80001
     *               tokenIds:
     *                 type: array
     *                 items:
     *                   type: number
     *                 example: [1, 2, 3]
     */
    router.post('/ccip/estimate-fee', (req, res) => {
        const { fromChainId, toChainId, tokenIds } = req.body;

        if (!fromChainId || !toChainId || !tokenIds?.length) {
            return res.status(400).json({ 
                error: 'Missing required fields: fromChainId, toChainId, tokenIds' 
            });
        }

        const fromNetwork = SUPPORTED_NETWORKS[fromChainId];
        const toNetwork = SUPPORTED_NETWORKS[toChainId];

        if (!fromNetwork || !toNetwork) {
            return res.status(400).json({ error: 'Unsupported network' });
        }

        // Mock fee calculation (in production, call actual CCIP fee estimation)
        const baseFee = 0.001; // Base CCIP fee
        const perTokenFee = 0.0005; // Per token fee
        const totalFee = baseFee + (tokenIds.length * perTokenFee);

        res.json({
            fromNetwork: fromNetwork.name,
            toNetwork: toNetwork.name,
            tokenCount: tokenIds.length,
            estimatedFee: {
                link: totalFee.toFixed(4),
                usd: (totalFee * 15).toFixed(2), // Assume $15 per LINK
                gasLimit: 500000
            },
            estimatedTime: '10-15 minutes',
            ccipSelectors: {
                from: fromNetwork.ccipSelector,
                to: toNetwork.ccipSelector
            }
        });
    });

    return router;
};
