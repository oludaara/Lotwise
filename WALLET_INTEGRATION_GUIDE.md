# 🔗 Lotwise Multi-Chain Wallet Integration

## Overview

Lotwise now supports seamless multi-chain wallet connection with CCIP-powered cross-chain transfers between Ethereum, Polygon, and Avalanche testnets.

## 🌐 Supported Networks

### Testnets (Primary Focus)
- **Ethereum Sepolia** (ChainID: 11155111) - Primary testnet
- **Polygon Mumbai** (ChainID: 80001) 
- **Avalanche Fuji** (ChainID: 43113)

### CCIP Integration
All networks support Chainlink Cross-Chain Interoperability Protocol (CCIP) for secure token transfers.

## 🚀 Quick Start for Frontend Developers

### 1. Include the Wallet Helper

```javascript
// Import the wallet helper
import { LotwiseWallet } from './lotwise-wallet.js';

// Initialize with your API base URL
const wallet = new LotwiseWallet('http://localhost:3001');
```

### 2. Connect Wallet

```javascript
// Connect wallet with automatic network detection
async function connectWallet() {
    try {
        const result = await wallet.connectWallet();
        console.log('Connected:', result);
        
        // Update your UI
        updateWalletUI(result);
    } catch (error) {
        console.error('Connection failed:', error);
        showError(error.message);
    }
}

function updateWalletUI(walletData) {
    document.getElementById('wallet-address').textContent = walletData.account;
    document.getElementById('current-network').textContent = walletData.network.name;
    document.getElementById('wallet-balance').textContent = 
        walletData.wallet.balance + ' ' + walletData.wallet.symbol;
}
```

### 3. Switch Networks with CCIP

```javascript
// Switch to different testnet
async function switchToPolygon() {
    try {
        const result = await wallet.switchToNetwork(80001); // Mumbai
        console.log('Switched to Polygon:', result);
        
        if (result.faucets) {
            showFaucetLinks(result.faucets);
        }
    } catch (error) {
        console.error('Network switch failed:', error);
    }
}

// Switch to Avalanche
async function switchToAvalanche() {
    await wallet.switchToNetwork(43113); // Fuji
}

// Switch back to Ethereum
async function switchToEthereum() {
    await wallet.switchToNetwork(11155111); // Sepolia
}
```

### 4. Cross-Chain Token Transfers

```javascript
// Transfer tokens across chains using CCIP
async function transferToAvalanche() {
    try {
        const tokenIds = [1, 2, 3]; // Your token IDs
        const result = await wallet.transferCrossChain(tokenIds, 43113);
        
        console.log('Transfer initiated:', result);
        
        // Show transfer details
        showTransferStatus({
            tokens: tokenIds.length,
            from: result.transfer.fromNetwork.name,
            to: result.transfer.toNetwork.name,
            estimatedTime: result.transfer.ccip.estimatedTime,
            fee: result.feeEstimate.estimatedFee.link + ' LINK'
        });
        
    } catch (error) {
        console.error('Transfer failed:', error);
    }
}
```

## 🔌 API Endpoints

### Wallet Connection
```
GET  /api/wallet/networks           # Get supported networks
POST /api/wallet/connect            # Connect wallet and create session
POST /api/wallet/switch-network     # Switch to different network
GET  /api/wallet/session/:sessionId # Get session information
POST /api/wallet/disconnect         # Disconnect wallet
```

### CCIP Integration
```
POST /api/wallet/ccip/estimate-fee  # Estimate cross-chain transfer fee
```

### Example API Calls

#### 1. Get Supported Networks
```javascript
const response = await fetch('http://localhost:3001/api/wallet/networks');
const data = await response.json();

console.log('Supported networks:', data.networks);
// Shows Sepolia, Mumbai, Fuji with CCIP support
```

#### 2. Connect Wallet
```javascript
const connectData = {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    chainId: 11155111, // Sepolia
    signature: "0x...", // Wallet signature
    message: "Connect to Lotwise on Sepolia"
};

const response = await fetch('http://localhost:3001/api/wallet/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(connectData)
});

const result = await response.json();
console.log('Session ID:', result.sessionId);
```

#### 3. Switch Networks
```javascript
const switchData = {
    sessionId: "session_abc123",
    targetChainId: 80001, // Switch to Mumbai
    transferTokens: true,  // Transfer tokens via CCIP
    tokenIds: [1, 2, 3]    // Tokens to transfer
};

const response = await fetch('http://localhost:3001/api/wallet/switch-network', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(switchData)
});

const result = await response.json();
console.log('Network switched:', result);
```

## 🎨 UI Integration Examples

### Connect Wallet Button
```html
<button id="connect-wallet" class="btn btn-primary">
    Connect Wallet
</button>

<div id="wallet-info" style="display: none;">
    <p>Address: <span id="wallet-address"></span></p>
    <p>Network: <span id="current-network"></span></p>
    <p>Balance: <span id="wallet-balance"></span></p>
</div>
```

### Network Switcher
```html
<div class="network-switcher">
    <h3>Switch Network</h3>
    <button onclick="switchToEthereum()">Ethereum Sepolia</button>
    <button onclick="switchToPolygon()">Polygon Mumbai</button>
    <button onclick="switchToAvalanche()">Avalanche Fuji</button>
</div>
```

### Faucet Links
```html
<div id="faucet-links" style="display: none;">
    <h4>Get Testnet Tokens</h4>
    <p>You'll need testnet tokens for gas fees:</p>
    <div id="faucet-list"></div>
</div>

<script>
function showFaucetLinks(faucets) {
    const faucetDiv = document.getElementById('faucet-links');
    const faucetList = document.getElementById('faucet-list');
    
    faucetList.innerHTML = faucets.urls.map(url => 
        `<a href="${url}" target="_blank" class="btn btn-sm btn-outline-primary">${url}</a>`
    ).join(' ');
    
    faucetDiv.style.display = 'block';
}
</script>
```

## 💡 Best Practices

### 1. Error Handling
```javascript
async function connectWithErrorHandling() {
    try {
        const result = await wallet.connectWallet();
        return result;
    } catch (error) {
        if (error.message.includes('No wallet detected')) {
            showInstallWalletPrompt();
        } else if (error.message.includes('Unsupported network')) {
            showNetworkSwitchPrompt();
        } else {
            showGenericError(error.message);
        }
    }
}
```

### 2. Session Management
```javascript
// Check for existing session on page load
async function checkExistingSession() {
    const sessionId = localStorage.getItem('lotwise_session_id');
    if (sessionId) {
        const session = await wallet.getSession();
        if (session) {
            updateWalletUI(session);
            return true;
        }
    }
    return false;
}

// Initialize on page load
window.addEventListener('load', async () => {
    const hasSession = await checkExistingSession();
    if (!hasSession) {
        showConnectWalletButton();
    }
});
```

### 3. Network Auto-Detection
```javascript
// Auto-switch to supported network
async function ensureSupportedNetwork() {
    if (!wallet.isWalletAvailable()) return false;
    
    const networks = await wallet.getSupportedNetworks();
    const currentChainId = await getCurrentChainId();
    
    const isSupported = networks.networks.some(n => n.chainId === currentChainId);
    
    if (!isSupported) {
        // Auto-switch to Sepolia (recommended testnet)
        await wallet.switchToNetwork(11155111);
    }
    
    return true;
}
```

## 🔧 Testing Your Integration

### 1. Start the API Server
```bash
cd /workspaces/Lotwise/api
npm install
node server.js
```

### 2. Test Wallet Endpoints
```bash
# Get supported networks
curl http://localhost:3001/api/wallet/networks

# Check API documentation
open http://localhost:3001/api-docs
```

### 3. Frontend Testing Checklist
- [ ] Wallet connection works
- [ ] Network switching works
- [ ] Error handling for unsupported networks
- [ ] Session persistence across page reloads
- [ ] Faucet links display correctly
- [ ] CCIP transfer estimation works

## 🎯 Production Deployment

### Environment Variables
```bash
# Network RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Contract Addresses (after deployment)
SEPOLIA_CONTRACT_ADDRESS=0x...
MUMBAI_CONTRACT_ADDRESS=0x...
FUJI_CONTRACT_ADDRESS=0x...
```

### Security Considerations
1. **Never store private keys** in frontend code
2. **Validate all signatures** on the backend
3. **Use HTTPS** in production
4. **Implement rate limiting** for API endpoints
5. **Session timeout** management

## 🎉 What's Ready

✅ **Multi-chain wallet connection**  
✅ **Automatic network detection**  
✅ **CCIP cross-chain transfers**  
✅ **Session management**  
✅ **Error handling**  
✅ **Faucet integration**  
✅ **Comprehensive API documentation**  
✅ **Frontend helper library**  

Your API is now **100% ready** for frontend integration with professional wallet connection features! 🚀
