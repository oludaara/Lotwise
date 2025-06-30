# 🏠 Lotwise - Advanced Fractional Real Estate Platform

## Overview

Lotwise is an advanced decentralized platform for **fractional real estate ownership** with full **Aave DeFi integration**. Each property is tokenized into **1,000 ERC-721 tokens** worth $1,000 each (for a $1M property), enabling fractional ownership, DeFi lending, cross-chain transfers, and automated yield distribution.

## 🚀 **Key Features**

### 🏗️ **Fractional Tokenization**

- **1,000 ERC-721 tokens per property** (0.1% ownership each)
- **$1,000 per token** for $1M property
- **Multiple properties** supported on single contract
- **Proportional ownership** with automatic tracking

### 💰 **Full Aave Integration**

- **Supply tokens as collateral** to earn yield
- **Borrow assets** against real estate collateral (75% max LTV)
- **Liquidation protection** with health factor monitoring
- **Real-time yield distribution** to token holders
- **5% APY base rate** with market-driven rates

### 🌐 **Cross-Chain Support**

- **Ethereum + Polygon** native support
- **Chainlink CCIP** for secure cross-chain transfers
- **Multi-chain portfolio** management
- **Unified liquidity** across networks

### 🏔️ **Network Support**

- **Ethereum Sepolia** (Primary testnet)
- **Avalanche Fuji** (Avalanche testnet)
- **Avalanche Mainnet** (C-Chain)
- **Polygon** (Layer 2 scaling)
- **Local Hardhat** (Development)

| Network           | Chain ID | RPC URL                                      | Explorer                                  | Status     |
| ----------------- | -------- | -------------------------------------------- | ----------------------------------------- | ---------- |
| Ethereum Sepolia  | 11155111 | `https://sepolia.infura.io/v3/...`           | [Etherscan](https://sepolia.etherscan.io) | ✅ Active  |
| Avalanche Fuji    | 43113    | `https://api.avax-test.network/ext/bc/C/rpc` | [Snowtrace](https://testnet.snowtrace.io) | ✅ Active  |
| Avalanche Mainnet | 43114    | `https://api.avax.network/ext/bc/C/rpc`      | [Snowtrace](https://snowtrace.io)         | ✅ Active  |
| Polygon           | 137      | `https://polygon-rpc.com`                    | [PolygonScan](https://polygonscan.com)    | 🔄 Planned |

### 📊 **Advanced DeFi Features**

- **Automated yield distribution** every 24 hours
- **Health factor monitoring** (liquidation at <80%)
- **Proportional rewards** based on token ownership
- **Liquidation protection** with custom thresholds
- **Real-time USD pricing** via Chainlink oracles

### 🏪 **Enhanced Marketplace**

- **USD-denominated pricing** with ETH conversion
- **Collateralized token protection** (can't trade staked tokens)
- **Trading fee collection** (1% platform fee)
- **Instant settlement** with automatic ownership transfer

## 📊 **System Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Real Estate   │───▶│   1,000 Tokens   │───▶│   Fractional    │
│   Property      │    │   ($1K each)     │    │   Ownership     │
│   ($1M value)   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chainlink     │    │   Aave Protocol  │    │   Yield         │
│   Price Feeds   │───▶│   Integration    │───▶│   Distribution  │
│   (ETH/USD)     │    │   (Lend/Borrow)  │    │   (5% APY)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ **Technical Implementation**

### Smart Contract Features

#### **Property Management**

```solidity
struct Property {
    string propertyId;       // Unique identifier
    uint256 totalValue;      // $1M = 1000000e18
    uint256 tokenPrice;      // $1K = 1000e18
    uint256 totalTokens;     // Always 1,000
    uint256 mintedTokens;    // Current minted count
    bool isActive;           // Active status
    string metadataURI;      // IPFS metadata
    address[] fractionalOwners; // Owner tracking
}
```

#### **Aave Position Tracking**

```solidity
struct AavePosition {
    uint256 suppliedAmount;    // Total collateral supplied
    uint256 borrowedAmount;    // Total amount borrowed
    uint256 lastYieldUpdate;   // Last yield calculation
    uint256 accumulatedYield;  // Total yield earned
    bool isCollateralized;     // Collateral status
    uint8 healthFactor;        // Position health (1-100)
}
```

#### **Yield Distribution System**

```solidity
mapping(uint256 => uint256) public propertyYieldPool;  // Property yield pools
mapping(uint256 => mapping(address => uint256)) public userYieldShare; // User shares
```

### API Endpoints

#### **Property Management**

- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties/:id/verify` - Verify property via Chainlink Functions

#### **User Portfolio**

- `GET /api/users/:address` - Get user profile
- `GET /api/users/:address/portfolio` - Get user portfolio

#### **Aave Integration**

- `GET /api/aave/position/:address` - Get user's Aave position
- `POST /api/aave/supply` - Supply tokens as collateral
- `POST /api/aave/borrow` - Borrow against collateral
- `POST /api/aave/repay` - Repay loans
- `POST /api/aave/withdraw` - Withdraw collateral

#### **Yield Management**

- `GET /api/yield/:propertyId` - Get property yield info
- `GET /api/yield/:propertyId/:address` - Get user's claimable yield
- `POST /api/yield/claim` - Claim accumulated yield

#### **Marketplace**

- `GET /api/marketplace` - List active token sales
- `POST /api/marketplace/list` - List token for sale
- `POST /api/marketplace/buy` - Purchase listed token

#### **Cross-Chain**

- `GET /api/crosschain/supported` - Supported networks
- `POST /api/crosschain/transfer` - Initiate cross-chain transfer

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet
- Testnet ETH (Sepolia) or Mainnet ETH

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/lotwise
cd lotwise

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Sepolia
npm run deploy

# Deploy to Avalanche Fuji Testnet
npm run deploy:fuji

# Deploy to Avalanche Mainnet
npm run deploy:avalanche

# Start API server
npm run start:api
```

### Environment Variables

```env
# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
PRIVATE_KEY=your_private_key_here

# Chainlink Price Feeds
## Sepolia Testnet
SEPOLIA_ETH_USD_PRICE_FEED=0x694AA1769357215DE4FAC081bf1f309aDC325306

## Avalanche Fuji Testnet
FUJI_AVAX_USD_PRICE_FEED=0x5498BB86BC934c8D34FDA08E81D444153d0D06aD
FUJI_ETH_USD_PRICE_FEED=0x86d67c3D38D2bCeE722E601025C25a575021c6EA

## Avalanche Mainnet
AVALANCHE_AVAX_USD_PRICE_FEED=0x0A77230d17318075983913bC2145DB16C7366156
AVALANCHE_ETH_USD_PRICE_FEED=0x976B3D034E162d8bD72D6b9C989d545b839003b0

# API Configuration
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/lotwise
```

## 🧪 **Testing & API**

### Smart Contract Tests

```bash
npm run test
```

### API Testing with Postman

We provide a comprehensive Postman collection for testing all API endpoints:

```bash
# Start API server
npm run start:api

# Quick terminal test
./test-api.sh
```

**Postman Setup:**

1. **Import Collection**: `postman/Lotwise-API-Collection.json`
2. **Import Environment**: `postman/Lotwise-Environment.json`
3. **Select Environment**: "Lotwise Development Environment"
4. **Start Testing**: 50+ requests organized by functionality

**Available Test Users:**

- `0x1234567890abcdef1234567890abcdef12345678` (Primary - 75 tokens)
- `0x742d35Cc6664C4532123C75F51C69c6CBc12345a` (Secondary - 25 tokens)
- `0xabcdef1234567890abcdef1234567890abcdef12` (Third - 150 tokens)

**API Endpoint Categories:**

- 🏠 **Property Management** (list, details, verification)
- 👤 **User Management** (profile, portfolio)
- 🏦 **Aave Integration** (supply, borrow, repay, withdraw)
- 💰 **Yield Management** (claim, track distribution)
- 🏪 **Marketplace** (list, buy tokens)
- 🌐 **Cross-Chain** (supported networks, transfers)
- 📊 **Analytics** (platform stats, price feeds)

See `postman/README.md` for detailed testing guide.

### Run All Tests

```bash
npm run test
```

### Test Coverage

```bash
npm run coverage
```

### Gas Analysis

```bash
npm run size
```

### Expected Test Results

```
✅ 35+ comprehensive tests covering:
   - Property creation and tokenization
   - Fractional ownership mechanics
   - Aave integration (supply, borrow, repay)
   - Yield distribution and claiming
   - Marketplace operations
   - Liquidation scenarios
   - Cross-chain functionality
   - Edge cases and error handling
```

## 📊 **Usage Examples**

### 1. Create and Mint Property Tokens

```javascript
// Create new property
await lotwise.createProperty(
  "PROP-001",
  ethers.parseEther("1000000"), // $1M property
  "ipfs://QmPropertyMetadata"
);

// Mint 10 tokens (10 * $1000 = $10,000 worth)
const quantity = 10;
const costETH = await lotwise._convertUSDToETH(ethers.parseEther("10000"));

await lotwise.mintPropertyTokens(1, userAddress, quantity, {
  value: costETH,
});
```

### 2. Use Tokens as Aave Collateral

```javascript
// Supply tokens as collateral
const tokenIds = [1, 2, 3, 4, 5]; // 5 tokens = $5000 collateral
await lotwise.supplyToAave(tokenIds);

// Borrow against collateral (max 75% LTV = $3750)
const borrowAmount = ethers.parseEther("3000"); // $3000
await lotwise.borrowFromAave(borrowAmount, usdcAddress);

// Check position health
const position = await lotwise.getAavePosition(userAddress);
console.log("Health Factor:", position.healthFactor); // Should be > 80
```

### 3. Claim Distributed Yield

```javascript
// Check claimable yield
const claimableYield = await lotwise.getClaimableYield(propertyId, userAddress);

// Claim yield (automatically converted to ETH)
if (claimableYield > 0) {
  await lotwise.claimYield(propertyId);
}
```

### 4. Trade on Marketplace

```javascript
// List token for sale
const tokenId = 1;
const salePrice = ethers.parseEther("1100"); // $1100 (10% premium)
await lotwise.listToken(tokenId, salePrice);

// Buy listed token
const listingPriceETH = await lotwise._convertUSDToETH(salePrice);
await lotwise.buyToken(tokenId, { value: listingPriceETH });
```

## 🔧 **Contract Addresses**

### Sepolia Testnet

- **Lotwise Contract**: `TBD` (deploy with `npm run deploy`)
- **ETH/USD Price Feed**: `0x694AA1769357215DE4FAC081bf1f309aDC325306`

### Avalanche Fuji Testnet

- **Lotwise Contract**: `TBD` (deploy with `npm run deploy:fuji`)
- **AVAX/USD Price Feed**: `0x5498BB86BC934c8D34FDA08E81D444153d0D06aD`
- **ETH/USD Price Feed**: `0x86d67c3D38D2bCeE722E601025C25a575021c6EA`

### Avalanche Mainnet

- **Lotwise Contract**: `TBD` (deploy with `npm run deploy:avalanche`)
- **AVAX/USD Price Feed**: `0x0A77230d17318075983913bC2145DB16C7366156`
- **ETH/USD Price Feed**: `0x976B3D034E162d8bD72D6b9C989d545b839003b0`

### Mainnet (Production)

- **Lotwise Contract**: `TBD`
- **ETH/USD Price Feed**: `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
- **MATIC/USD Price Feed**: `0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676`

## 🛡️ **Security Features**

### Smart Contract Security

- **ReentrancyGuard** protection on all state-changing functions
- **Ownable** access control with authorized operators
- **Emergency pause** functionality
- **Collateral protection** (can't transfer staked tokens)

### Economic Security

- **Health factor monitoring** prevents over-borrowing
- **Liquidation thresholds** protect against bad debt
- **Maximum LTV ratios** (75%) prevent excessive leverage
- **Yield distribution caps** prevent drain attacks

### Oracle Security

- **Chainlink price feeds** for reliable USD pricing
- **Fallback pricing** mechanisms
- **Price update intervals** with staleness checks

## 🔮 **Roadmap**

### Phase 1 (Current) - Core Platform ✅

- [x] Fractional tokenization (1,000 tokens/property)
- [x] Full Aave integration (supply, borrow, yield)
- [x] Cross-chain support (Ethereum + Avalanche)
- [x] Automated yield distribution
- [x] Enhanced marketplace
- [x] Avalanche Fuji testnet support
- [x] Complete database-driven backend
- [x] Swagger API documentation

### Phase 2 - Advanced Features 🚧

- [ ] Multi-asset borrowing (USDC, USDT, DAI)
- [ ] Flash loan integration
- [ ] Governance token (LTWS)
- [ ] DAO-based property acquisition
- [ ] Insurance protocols integration
- [ ] Polygon network integration

### Phase 3 - Scale & Optimize 📈

- [ ] Layer 2 expansion (Arbitrum, Optimism)
- [ ] Mobile app development
- [ ] Institutional features
- [ ] Real-world asset bridge
- [ ] Regulatory compliance tools

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 **Links**

- **Documentation**: [docs.lotwise.io](https://docs.lotwise.io)
- **Website**: [lotwise.io](https://lotwise.io)
- **Discord**: [discord.gg/lotwise](https://discord.gg/lotwise)
- **Twitter**: [@lotwiseio](https://twitter.com/lotwiseio)

## ⚠️ **Disclaimer**

This software is provided "as is" and is experimental. Use at your own risk. Real estate tokenization may be subject to securities regulations in your jurisdiction. Please consult with legal and financial professionals before using this platform for actual real estate transactions.

---

**Built with ❤️ by the Lotwise Team**
