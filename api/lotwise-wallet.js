/**
 * Lotwise Wallet Integration Helper
 * Easy-to-use JavaScript functions for connecting wallets with multi-chain support
 * 
 * Usage:
 * import { LotwiseWallet } from './lotwise-wallet.js';
 * 
 * const wallet = new LotwiseWallet('http://localhost:3001');
 * await wallet.connectWallet();
 */

class LotwiseWallet {
    constructor(apiBaseUrl = 'http://localhost:3001') {
        this.apiBaseUrl = apiBaseUrl;
        this.sessionId = localStorage.getItem('lotwise_session_id');
        this.currentNetwork = null;
        this.account = null;
        this.supportedNetworks = null;
        
        // Testnet configurations for CCIP
        this.networks = {
            11155111: { // Sepolia
                name: 'Sepolia',
                symbol: 'ETH',
                rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/ipdedLl0wIygq5b-DGbyYVKnI5MzW0v4',
                blockExplorer: 'https://sepolia.etherscan.io',
                faucets: ['https://sepoliafaucet.com/', 'https://faucets.chain.link/sepolia']
            },
            80001: { // Mumbai
                name: 'Mumbai',
                symbol: 'MATIC',
                rpcUrl: 'https://rpc-mumbai.maticvigil.com',
                blockExplorer: 'https://mumbai.polygonscan.com',
                faucets: ['https://faucet.polygon.technology/', 'https://faucets.chain.link/mumbai']
            },
            43113: { // Avalanche Fuji
                name: 'Avalanche Fuji',
                symbol: 'AVAX',
                rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
                blockExplorer: 'https://testnet.snowtrace.io',
                faucets: ['https://faucet.avax.network/', 'https://faucets.chain.link/fuji']
            }
        };
    }

    /**
     * Check if MetaMask or compatible wallet is available
     */
    isWalletAvailable() {
        return typeof window !== 'undefined' && 
               typeof window.ethereum !== 'undefined';
    }

    /**
     * Get supported networks from API
     */
    async getSupportedNetworks() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/wallet/networks`);
            const data = await response.json();
            this.supportedNetworks = data.networks;
            return data;
        } catch (error) {
            console.error('Failed to fetch supported networks:', error);
            throw error;
        }
    }

    /**
     * Connect wallet with automatic network detection
     */
    async connectWallet() {
        if (!this.isWalletAvailable()) {
            throw new Error('No wallet detected. Please install MetaMask or a compatible wallet.');
        }

        try {
            // Request wallet connection
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found. Please unlock your wallet.');
            }

            this.account = accounts[0];

            // Get current network
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });
            const currentChainId = parseInt(chainId, 16);

            // Check if current network is supported
            await this.getSupportedNetworks();
            const supportedChainIds = this.supportedNetworks.map(n => n.chainId);
            
            if (!supportedChainIds.includes(currentChainId)) {
                // Auto-switch to Sepolia (recommended testnet)
                await this.switchToNetwork(11155111);
                return await this.connectWallet(); // Retry after switch
            }

            // Create signature for authentication
            const message = `Connect to Lotwise on ${this.networks[currentChainId]?.name || 'Unknown Network'}`;
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, this.account]
            });

            // Authenticate with API
            const response = await fetch(`${this.apiBaseUrl}/api/wallet/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: this.account,
                    chainId: currentChainId,
                    signature: signature,
                    message: message
                })
            });

            if (!response.ok) {
                throw new Error('Failed to authenticate with Lotwise API');
            }

            const authData = await response.json();
            this.sessionId = authData.sessionId;
            this.currentNetwork = authData.network;
            
            // Store session
            localStorage.setItem('lotwise_session_id', this.sessionId);
            localStorage.setItem('lotwise_account', this.account);

            // Setup wallet event listeners
            this.setupEventListeners();

            return {
                success: true,
                account: this.account,
                network: authData.network,
                user: authData.user,
                wallet: authData.wallet,
                sessionId: this.sessionId
            };

        } catch (error) {
            console.error('Wallet connection failed:', error);
            throw error;
        }
    }

    /**
     * Switch to a specific network
     */
    async switchToNetwork(chainId) {
        if (!this.isWalletAvailable()) {
            throw new Error('No wallet detected');
        }

        const network = this.networks[chainId];
        if (!network) {
            throw new Error(`Unsupported network: ${chainId}`);
        }

        try {
            // Try to switch to the network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }]
            });

            // If we have an active session, update it via API
            if (this.sessionId) {
                const response = await fetch(`${this.apiBaseUrl}/api/wallet/switch-network`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: this.sessionId,
                        targetChainId: chainId
                    })
                });

                if (response.ok) {
                    const switchData = await response.json();
                    this.currentNetwork = switchData.toNetwork;
                    return switchData;
                }
            }

        } catch (error) {
            // If the network doesn't exist in wallet, add it
            if (error.code === 4902) {
                await this.addNetwork(chainId);
                return await this.switchToNetwork(chainId); // Retry after adding
            }
            throw error;
        }
    }

    /**
     * Add a new network to the wallet
     */
    async addNetwork(chainId) {
        const network = this.networks[chainId];
        if (!network) {
            throw new Error(`Network configuration not found for chainId: ${chainId}`);
        }

        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: `0x${chainId.toString(16)}`,
                chainName: network.name,
                nativeCurrency: {
                    name: network.symbol,
                    symbol: network.symbol,
                    decimals: 18
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorer]
            }]
        });
    }

    /**
     * Get current session information
     */
    async getSession() {
        if (!this.sessionId) {
            return null;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/wallet/session/${this.sessionId}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch session:', error);
            return null;
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        if (this.sessionId) {
            try {
                await fetch(`${this.apiBaseUrl}/api/wallet/disconnect`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: this.sessionId
                    })
                });
            } catch (error) {
                console.error('API disconnect failed:', error);
            }
        }

        // Clear local data
        localStorage.removeItem('lotwise_session_id');
        localStorage.removeItem('lotwise_account');
        this.sessionId = null;
        this.account = null;
        this.currentNetwork = null;
    }

    /**
     * Setup event listeners for wallet changes
     */
    setupEventListeners() {
        if (!window.ethereum) return;

        // Account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else if (accounts[0] !== this.account) {
                // Account changed, reconnect
                this.connectWallet();
            }
        });

        // Network changes
        window.ethereum.on('chainChanged', (chainId) => {
            const newChainId = parseInt(chainId, 16);
            console.log(`Network changed to: ${newChainId}`);
            
            // Update current network
            if (this.networks[newChainId]) {
                this.currentNetwork = this.networks[newChainId];
            }
            
            // Optionally reload or update UI
            window.location.reload();
        });

        // Connection changes
        window.ethereum.on('connect', (connectInfo) => {
            console.log('Wallet connected:', connectInfo);
        });

        window.ethereum.on('disconnect', (error) => {
            console.log('Wallet disconnected:', error);
            this.disconnect();
        });
    }

    /**
     * Get testnet faucet links for current network
     */
    getFaucetLinks() {
        if (!this.currentNetwork) return [];
        
        const chainId = this.getChainIdFromNetwork(this.currentNetwork);
        return this.networks[chainId]?.faucets || [];
    }

    /**
     * Helper to get chain ID from network object
     */
    getChainIdFromNetwork(network) {
        const chainMap = {
            'Sepolia': 11155111,
            'Mumbai': 80001,
            'Avalanche Fuji': 43113
        };
        return chainMap[network.name] || null;
    }

    /**
     * Transfer tokens across chains using CCIP
     */
    async transferCrossChain(tokenIds, targetChainId) {
        if (!this.sessionId) {
            throw new Error('No active session. Please connect wallet first.');
        }

        try {
            // First, estimate the fee
            const feeResponse = await fetch(`${this.apiBaseUrl}/api/wallet/ccip/estimate-fee`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromChainId: this.getChainIdFromNetwork(this.currentNetwork),
                    toChainId: targetChainId,
                    tokenIds: tokenIds
                })
            });

            const feeData = await feeResponse.json();

            // Initiate the transfer
            const transferResponse = await fetch(`${this.apiBaseUrl}/api/wallet/switch-network`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    targetChainId: targetChainId,
                    transferTokens: true,
                    tokenIds: tokenIds
                })
            });

            if (!transferResponse.ok) {
                throw new Error('Cross-chain transfer failed');
            }

            const transferData = await transferResponse.json();
            return {
                feeEstimate: feeData,
                transfer: transferData
            };

        } catch (error) {
            console.error('Cross-chain transfer failed:', error);
            throw error;
        }
    }
}

// Export for use in frontend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LotwiseWallet };
}

// Example usage for frontend developers:
/*

// Initialize wallet connection
const wallet = new LotwiseWallet('http://localhost:3001');

// Connect wallet button
document.getElementById('connect-wallet').onclick = async () => {
    try {
        const result = await wallet.connectWallet();
        console.log('Connected:', result);
        updateUI(result);
    } catch (error) {
        console.error('Connection failed:', error);
        alert('Failed to connect wallet: ' + error.message);
    }
};

// Switch network button  
document.getElementById('switch-to-polygon').onclick = async () => {
    try {
        await wallet.switchToNetwork(80001); // Mumbai
        console.log('Switched to Polygon Mumbai');
    } catch (error) {
        console.error('Network switch failed:', error);
    }
};

// Cross-chain transfer
document.getElementById('transfer-to-avalanche').onclick = async () => {
    try {
        const result = await wallet.transferCrossChain([1, 2, 3], 43113); // Fuji
        console.log('Transfer initiated:', result);
    } catch (error) {
        console.error('Transfer failed:', error);
    }
};

// Disconnect wallet
document.getElementById('disconnect').onclick = async () => {
    await wallet.disconnect();
    console.log('Wallet disconnected');
};

function updateUI(walletData) {
    document.getElementById('wallet-address').textContent = walletData.account;
    document.getElementById('current-network').textContent = walletData.network.name;
    document.getElementById('wallet-balance').textContent = walletData.wallet.balance + ' ' + walletData.wallet.symbol;
}

*/
