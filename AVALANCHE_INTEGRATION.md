# 🏔️ Avalanche Integration Guide

## Overview

Lotwise now includes comprehensive support for the Avalanche ecosystem, including both the Fuji testnet and Avalanche C-Chain mainnet. This integration provides users with fast, low-cost transactions and access to Avalanche's growing DeFi ecosystem.

## 🌐 Supported Networks

### Avalanche Fuji Testnet
- **Chain ID:** 43113
- **RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Explorer:** [Snowtrace Testnet](https://testnet.snowtrace.io)
- **Faucet:** [Avalanche Faucet](https://faucet.avax.network/)
- **Currency:** AVAX (testnet)

### Avalanche C-Chain Mainnet
- **Chain ID:** 43114
- **RPC URL:** `https://api.avax.network/ext/bc/C/rpc`
- **Explorer:** [Snowtrace](https://snowtrace.io)
- **Currency:** AVAX (mainnet)

## 🚀 Quick Setup

### 1. Environment Configuration

Add these variables to your `.env` file:

```env
# Avalanche RPC URLs
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc

# Avalanche Price Feeds
FUJI_AVAX_USD_PRICE_FEED=0x5498BB86BC934c8D34FDA08E81D444153d0D06aD
FUJI_ETH_USD_PRICE_FEED=0x86d67c3D38D2bCeE722E601025C25a575021c6EA
AVALANCHE_AVAX_USD_PRICE_FEED=0x0A77230d17318075983913bC2145DB16C7366156
AVALANCHE_ETH_USD_PRICE_FEED=0x976B3D034E162d8bD72D6b9C989d545b839003b0

# Aave Protocol (if using)
FUJI_AAVE_POOL=0x1775ECC8362dB6CaB0c7A9C0957cF656A5276c29
FUJI_AAVE_POOL_DATA_PROVIDER=0x50ddd0Cd4266299527d25De9CBb55fE0EB8dAc30
```

### 2. Add Network to MetaMask

**Avalanche Fuji Testnet:**
- Network Name: `Avalanche Fuji Testnet`
- RPC URL: `https://api.avax-test.network/ext/bc/C/rpc`
- Chain ID: `43113`
- Currency Symbol: `AVAX`
- Explorer: `https://testnet.snowtrace.io`

**Avalanche Mainnet:**
- Network Name: `Avalanche Network`
- RPC URL: `https://api.avax.network/ext/bc/C/rpc`
- Chain ID: `43114`
- Currency Symbol: `AVAX`
- Explorer: `https://snowtrace.io`

### 3. Get Testnet AVAX

Visit the [Avalanche Faucet](https://faucet.avax.network/) to get testnet AVAX for development and testing.

## 📋 Deployment

### Test Configuration
```bash
# Test Avalanche configuration
npm run test:avalanche
```

### Deploy to Fuji Testnet
```bash
# Deploy to Avalanche Fuji
npm run deploy:fuji
```

### Deploy to Avalanche Mainnet
```bash
# Deploy to Avalanche mainnet
npm run deploy:avalanche
```

### Verify Contracts
```bash
# Verify on Fuji
npm run verify:fuji -- <CONTRACT_ADDRESS>

# Verify on Avalanche mainnet
npm run verify:avalanche -- <CONTRACT_ADDRESS>
```

## 🔗 Chainlink Integration

### Price Feeds

| Asset | Network | Address | Decimals |
|-------|---------|---------|----------|
| AVAX/USD | Fuji | `0x5498BB86BC934c8D34FDA08E81D444153d0D06aD` | 8 |
| ETH/USD | Fuji | `0x86d67c3D38D2bCeE722E601025C25a575021c6EA` | 8 |
| AVAX/USD | Mainnet | `0x0A77230d17318075983913bC2145DB16C7366156` | 8 |
| ETH/USD | Mainnet | `0x976B3D034E162d8bD72D6b9C989d545b839003b0` | 8 |

### CCIP (Cross-Chain Interoperability Protocol)

| Network | Chain Selector | Router Address |
|---------|----------------|----------------|
| Fuji | `14767482510784806043` | `0xF694E193200268f9a4868e4Aa017A0118C9a8177` |
| Avalanche | `6433500567565415381` | `0x27F39D0af3303703750D4001fCc1844c6491563c` |

## 🏦 Aave Integration

### Fuji Testnet
- **Pool:** `0x1775ECC8362dB6CaB0c7A9C0957cF656A5276c29`
- **Data Provider:** `0x50ddd0Cd4266299527d25De9CBb55fE0EB8dAc30`

### Avalanche Mainnet
- **Pool:** `0x794a61358D6845594F94dc1DB02A252b5b4814aD`
- **Data Provider:** `0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654`

## 💡 Key Benefits

### Performance
- **Sub-second finality** with Avalanche consensus
- **Low transaction fees** (typically < $0.01)
- **High throughput** (4,500+ TPS)

### Ecosystem
- **Growing DeFi ecosystem** with Aave, Curve, GMX
- **Cross-chain bridges** via Chainlink CCIP
- **Strong institutional adoption**

### Developer Experience
- **EVM compatibility** - same Solidity contracts
- **Familiar tooling** - Hardhat, MetaMask, etc.
- **Rich infrastructure** - indexers, oracles, bridges

## 🔧 API Integration

The Lotwise API automatically supports Avalanche networks:

```javascript
// Get supported chains
const response = await fetch('/api/crosschain/supported');
const data = await response.json();

// Avalanche networks will be included:
// { chainId: 43113, name: 'Avalanche Fuji', symbol: 'AVAX', network: 'testnet' }
// { chainId: 43114, name: 'Avalanche', symbol: 'AVAX', network: 'mainnet' }
```

## 🚨 Important Notes

### Gas Pricing
- Avalanche uses dynamic gas pricing
- Default gas price: 25 Gwei (configured in hardhat.config.js)
- Monitor gas prices at [SnowTrace Gas Tracker](https://snowtrace.io/gastracker)

### Contract Verification
- Use [Snowtrace](https://snowtrace.io) for mainnet verification
- Use [Testnet Snowtrace](https://testnet.snowtrace.io) for Fuji verification
- Verification process is similar to Etherscan

### Bridge Considerations
- Use official [Avalanche Bridge](https://bridge.avax.network/) for asset transfers
- Consider Chainlink CCIP for secure cross-chain messaging
- Always test transfers on testnets first

## 🛠️ Troubleshooting

### Common Issues

**"Insufficient funds for gas"**
- Get testnet AVAX from the faucet
- Check gas price settings in hardhat.config.js

**"Network not supported"**
- Verify RPC URL is correct
- Check chain ID matches (43113 for Fuji, 43114 for mainnet)
- Ensure MetaMask has the network added

**"Price feed not found"**
- Verify price feed addresses in .env
- Check if the feed is active on the network
- Refer to [Chainlink Data Feeds](https://docs.chain.link/data-feeds/price-feeds/addresses?network=avalanche)

### Debug Commands

```bash
# Test network connectivity
npm run test:avalanche

# Check contract size
npm run size

# Generate coverage report
npm run coverage
```

## 📚 Resources

- [Avalanche Documentation](https://docs.avax.network/)
- [Avalanche Developer Portal](https://www.avax.network/developers)
- [Chainlink on Avalanche](https://docs.chain.link/docs/avalanche-price-feeds/)
- [Aave on Avalanche](https://docs.aave.com/developers/deployed-contracts/avalanche)
- [MetaMask Avalanche Setup](https://support.avax.network/en/articles/4626956-how-do-i-set-up-metamask-on-avalanche)

## 🤝 Community

- [Avalanche Discord](https://chat.avax.network/)
- [Avalanche Telegram](https://t.me/avalancheavax)
- [Avalanche Reddit](https://www.reddit.com/r/Avax/)
- [Chainlink Discord](https://discord.gg/aSK4zew)

---

**Ready to build on Avalanche? Start with:**
```bash
npm run test:avalanche && npm run deploy:fuji
```
