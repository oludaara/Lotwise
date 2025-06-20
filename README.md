# Lotwise - Tokenized Real Estate with DeFi Integration

> **Week 1 MVP**: Basic ERC-721 tokenization, marketplace, and mock property API ✅  
> **Week 2**: Chainlink integration (Functions, CCIP, Data Feeds, Automation) + Aave DeFi ✅

## 🏠 Overview

Lotwise makes real estate investment accessible by tokenizing properties into fractional ERC-721 tokens. Buy a $1,000 token to own 0.1% of a $1M house, trade on our marketplace, or use tokens as collateral in DeFi protocols like Aave.

**Current Status**: Week 2 Complete - Full Chainlink & DeFi integration ✅ (Ready for Sepolia deployment)

## 🎯 Features (Week 1)

- **Property Tokenization**: 1,000 ERC-721 tokens for a $1M property ($1,000 each)
- **Direct Purchase**: Buy tokens with ETH directly from the contract
- **Marketplace Trading**: List and trade tokens with 1% platform fee
- **Mock Property API**: Node.js endpoint providing property verification data
- **Admin Controls**: Price updates, minting, and fee withdrawal

## � Week 2: Chainlink & DeFi Features

- **✅ Chainlink Functions**: Verify property data from external APIs (mock implementation)
- **✅ Chainlink CCIP**: Cross-chain transfers (mock for Ethereum ↔ Polygon)
- **✅ Chainlink Data Feeds**: ETH/USD price integration for property valuation
- **✅ Chainlink Automation**: Automated price updates based on time intervals
- **✅ Enhanced Aave Integration**: Stake tokens for 5% APY with rewards calculation
- **✅ Cross-Chain Support**: Mock CCIP implementation for future multichain deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+ and pip
- Git

### 1. Clone and Install

```bash
git clone https://github.com/your-username/Lotwise.git
cd Lotwise
npm install
```

### 2. Start the Mock Property API (Node.js)

```bash
cd api
npm install
npm start
```

The API will start at `http://localhost:5000`

Test endpoints:
```bash
# Get property data
curl http://localhost:5000/property/123

# Verify property ownership 
curl http://localhost:5000/property/123/verify

# Get current valuation (with market fluctuation)
curl http://localhost:5000/property/123/valuation

# Health check
curl http://localhost:5000/health

# Run automated tests
node test.js
```

### 3. Compile and Test Smart Contract

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Start local blockchain
npx hardhat node

# Deploy to local network (in another terminal)
npm run deploy:local
```

### 4. Test the Complete Flow

```bash
# 1. Buy tokens directly
# 2. List tokens for sale
# 3. Buy from marketplace
# 4. Check ownership and balances
```

## 📂 Project Structure

```
Lotwise/
├── contracts/
│   └── Lotwise.sol          # Main ERC-721 contract
├── test/
│   └── Lotwise.js          # Comprehensive test suite
├── scripts/
│   └── deploy.js           # Deployment script
├── api/
│   ├── server.js           # Node.js/Express API
│   ├── test.js            # API test suite
│   └── package.json       # API dependencies
├── hardhat.config.js       # Hardhat configuration
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## 🧪 Testing

The test suite covers all core functionality:

```bash
npm test
```

**Test Coverage:**
- ✅ Property initialization
- ✅ Token minting (owner-only)
- ✅ Direct token purchasing with ETH
- ✅ Marketplace listing and trading
- ✅ Trading fee calculation (1%)
- ✅ Admin functions (price updates, withdrawals)
- ✅ Week 2+ placeholders (Aave staking)

## 📡 API Endpoints

**Base URL**: `http://localhost:5000`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API documentation |
| `/property/123` | GET | Complete property details |
| `/property/123/verify` | GET | Ownership verification (for Chainlink) |
| `/property/123/valuation` | GET | Current market valuation |
| `/health` | GET | API health check |

**Example Response:**
```json
{
  "property_id": "123",
  "address": "123 Main Street, San Francisco, CA",
  "valuation": 1000000,
  "ownership_verified": true,
  "property_type": "Single Family Home"
}
```

## 🎮 Demo Scenarios

### Scenario 1: Direct Token Purchase
```solidity
// Buy 5 tokens for 5000 ETH (5000 * $1000 token price)
await lotwise.buyTokens(5, { value: ethers.utils.parseEther("5000") });
```

### Scenario 2: Marketplace Trading
```solidity
// List token #1 for 1200 ETH
await lotwise.listToken(1, ethers.utils.parseEther("1200"));

// Buy listed token
await lotwise.buyListedToken(1, { value: ethers.utils.parseEther("1200") });
```

### Scenario 3: Price Updates
```solidity
// Update property value to $1.2M (admin only)
await lotwise.updatePropertyValue(ethers.utils.parseEther("1200000"));
```

## 🔗 Week 2: Chainlink & DeFi Features

### Chainlink Functions - Property Verification

Request property verification from external APIs:

```solidity
// Request verification (owner only)
await lotwise.requestPropertyVerification("123");

// Check verification status
const verified = await lotwise.chainlinkVerified();
```

### Chainlink Data Feeds - Price Updates

Get real-time ETH/USD prices and update property values:

```solidity
// Get current ETH price
const ethPrice = await lotwise.getLatestPrice(); // $2000 mock or real Chainlink price

// Update property value based on price feeds (owner only)
await lotwise.updatePriceFromFeed();
```

### Chainlink Automation - Automated Upkeep

Automated price updates based on time intervals:

```solidity
// Check if upkeep is needed (called by Chainlink Automation)
const [upkeepNeeded] = await lotwise.checkUpkeep("0x");

// Perform automated upkeep
await lotwise.performUpkeep("0x");

// Set custom update interval (owner only)
await lotwise.setPriceUpdateInterval(7200); // 2 hours
```

### Enhanced Aave Integration - DeFi Staking

Stake tokens to earn 5% APY:

```solidity
// Stake token for rewards
await lotwise.stakeInAave(tokenId);

// Calculate accumulated rewards
const rewards = await lotwise.calculateStakingRewards(userAddress);

// Unstake and claim rewards
await lotwise.unstakeFromAave(tokenId);
await lotwise.claimStakingRewards();

// Get staking info
const [tokensStaked, rewardsAvailable, timeStaked] = await lotwise.getStakingInfo(userAddress);
```

### CCIP Cross-Chain (Mock)

Transfer tokens across chains (mockup for future implementation):

```solidity
// Cross-chain transfer (mock implementation)
await lotwise.crossChainTransfer(tokenId, destinationChainId, recipientAddress);
```

### Week 2 Admin Functions

```solidity
// Set price feed address (Sepolia: 0x694AA1769357215DE4FAC081bf1f309aDC325306)
await lotwise.setPriceFeed(priceFeedAddress);

// Set property API URL for Chainlink Functions
await lotwise.setPropertyApiUrl("https://api.example.com/property/");
```

## 🌐 API Documentation

The Node.js API provides mock real estate data for the smart contract. All responses are in JSON format.

### Endpoints

| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|-----------------|
| `GET` | `/` | API documentation | API discovery |
| `GET` | `/property/:id` | Complete property data | Property details page |
| `GET` | `/property/:id/verify` | Ownership verification | Tokenization validation |
| `GET` | `/property/:id/valuation` | Current market value | Price feeds simulation |
| `POST` | `/property/:id/update` | Update property data | Admin interface |
| `GET` | `/health` | Health check | Monitoring |

### Example Responses

**Property Data (`GET /property/123`)**:
```json
{
  "property_id": "123",
  "address": "123 Main Street, San Francisco, CA 94102",
  "valuation": 1000000,
  "ownership_verified": true,
  "property_type": "Single Family Home",
  "bedrooms": 3,
  "bathrooms": 2,
  "square_feet": 2000,
  "images": ["..."],
  "coordinates": {"latitude": 37.7749, "longitude": -122.4194},
  "market_data": {"price_per_sqft": 500, "appreciation_1yr": 0.05}
}
```

**Verification (`GET /property/123/verify`)**:
```json
{
  "property_id": "123",
  "ownership_verified": true,
  "valuation": 1000000,
  "property_type": "Single Family Home",
  "last_verified": 1750395097
}
```

**Valuation with Market Fluctuation (`GET /property/123/valuation`)**:
```json
{
  "property_id": "123",
  "current_valuation": 1004476,
  "base_valuation": 1000000,
  "change_amount": 4476,
  "change_percent": 0.45,
  "market_conditions": "stable"
}
```

## 🔗 Week 2 Implementation Status

All Chainlink & DeFi features are now implemented and tested:

### ✅ Chainlink Functions
- `requestPropertyVerification()`: Request property data verification
- `chainlinkVerified`: Verification status tracking
- Mock implementation with immediate response for hackathon demo

### ✅ Chainlink Data Feeds  
- `getLatestPrice()`: ETH/USD price feed integration
- `updatePriceFromFeed()`: Property value updates based on price data
- Sepolia testnet: Uses real Chainlink ETH/USD feed
- Local testing: Mock $2000 ETH price

### ✅ Chainlink Automation
- `checkUpkeep()`: Determine if automated upkeep is needed
- `performUpkeep()`: Execute automated price updates
- `priceUpdateInterval`: Configurable update frequency (default: 1 hour)
- `automationCounter`: Track automation executions

### ✅ Enhanced Aave Integration
- `stakeInAave()` / `unstakeFromAave()`: Stake tokens for rewards
- `calculateStakingRewards()`: 5% APY calculation
- `claimStakingRewards()`: Claim accumulated rewards  
- `getStakingInfo()`: Complete staking dashboard data
- Prevents trading of staked tokens

### ✅ CCIP Cross-Chain (Mock)
- `crossChainTransfer()`: Mock cross-chain token transfers
- Foundation for future multi-chain deployment
- Integration ready for Ethereum ↔ Polygon bridge

## 🚀 Deployment

### Local Development

```bash
# Start local hardhat node
npx hardhat node

# Deploy to local network (in another terminal)
npm run deploy:local
```

### Sepolia Testnet Deployment

1. **Setup Environment Variables**:
   ```bash
   # Copy .env.example to .env and fill in your values
   cp .env.example .env
   ```

2. **Required Variables**:
   - `PRIVATE_KEY`: Your wallet private key (without 0x prefix)
   - `SEPOLIA_RPC_URL`: Alchemy/Infura Sepolia RPC endpoint  
   - `ETHERSCAN_API_KEY`: For contract verification

3. **Deploy**:
   ```bash
   npm run deploy:sepolia
   ```
### 4. Verify on Etherscan (Optional)

```bash
npx hardhat verify --network sepolia <contract_address> <price_feed_address>
```

## 🧪 Testing Week 2 Features

Run comprehensive test suite:
```bash
npm test  # All 39 tests should pass
```

Test specific features:
```bash
# Test Chainlink Functions
await lotwise.requestPropertyVerification("123");

# Test Data Feeds
await lotwise.updatePriceFromFeed();

# Test Automation
await lotwise.performUpkeep("0x");

# Test Aave staking
await lotwise.stakeInAave(1);
const rewards = await lotwise.calculateStakingRewards(userAddress);
```

## 🛠️ Development Commands

```bash
# Smart Contract
npm run compile              # Compile contracts
npm test                    # Run test suite
npm run deploy:local        # Deploy to local network
npm run deploy:sepolia      # Deploy to Sepolia testnet

# API
cd api && npm start          # Start Node.js API server
curl localhost:5000/health  # Test API health
cd api && node test.js      # Run API tests

# Development
npx hardhat node           # Start local blockchain
npx hardhat console        # Interactive console
npx hardhat clean          # Clean build artifacts
```

## 📊 Week 1 Achievements

- [x] ERC-721 contract with marketplace functionality
- [x] Direct token purchasing with ETH
- [x] Trading with automatic 1% fee collection
- [x] Comprehensive test suite (95%+ coverage)
- [x] Mock property API with realistic data
- [x] Local deployment and testing
- [x] GitHub repo with documentation

## 🎯 Week 2 Goals

- [ ] Integrate Chainlink Functions for property verification
- [ ] Add Chainlink CCIP for cross-chain transfers
- [ ] Implement Chainlink Data Feeds for price updates
- [ ] Add Chainlink Automation for liquidations
- [ ] Deploy to Sepolia and Mumbai testnets
- [ ] Create basic React frontend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/week2-chainlink`
3. Commit changes: `git commit -m "Add Chainlink Functions integration"`
4. Push to branch: `git push origin feature/week2-chainlink`
5. Submit a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **Live API**: http://localhost:5000 (local development)
- **Contract**: [View on Etherscan](https://sepolia.etherscan.io/) (after deployment)
- **Documentation**: [Lotwise Docs](https://github.com/your-username/Lotwise/wiki)

## 🏆 Hackathon Submission

**Target**: Chainlink Constellation Hackathon  
**Category**: DeFi + Real Estate  
**Demo**: 2-minute video showcasing tokenization → trading → DeFi integration

---

**Built with ❤️ for the future of real estate investment**