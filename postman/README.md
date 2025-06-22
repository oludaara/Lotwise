# 🧪 Postman API Testing Guide for Lotwise

## 📋 Quick Setup

### 1. Import Collection & Environment
1. **Open Postman**
2. **Import Collection**: 
   - Click "Import" → "Upload Files" 
   - Select: `postman/Lotwise-API-Collection.json`
3. **Import Environment**: 
   - Settings ⚙️ → "Environments" → "Import"
   - Select: `postman/Lotwise-Environment.json`
4. **Select Environment**: Choose "Lotwise Development Environment" from dropdown

### 2. Start the API Server
```bash
cd /workspaces/Lotwise
npm run start:api
```
✅ Server should be running at `http://localhost:3001`

## 🎯 **Essential Test Scenarios**

### Scenario 1: Platform Health Check
```
1. GET /api/health          → Check server is running
2. GET /api/stats           → Get platform statistics  
3. GET /api/prices          → Verify price feeds working
```

### Scenario 2: Property & User Data
```
1. GET /api/properties      → List all properties
2. GET /api/properties/1    → Get property #1 details
3. GET /api/users/{address} → Get user profile
4. GET /api/users/{address}/portfolio → Get user portfolio
```

### Scenario 3: Aave Integration Flow
```
1. GET /api/aave/position/{address}    → Check initial position
2. POST /api/aave/supply              → Supply tokens as collateral
3. POST /api/aave/borrow              → Borrow against collateral  
4. GET /api/aave/position/{address}    → Verify updated position
5. POST /api/aave/repay               → Repay loan
6. POST /api/aave/withdraw            → Withdraw collateral
```

### Scenario 4: Yield Management
```
1. GET /api/yield/1                   → Get property yield info
2. GET /api/yield/1/{address}         → Check claimable yield
3. POST /api/yield/claim              → Claim accumulated yield
```

### Scenario 5: Marketplace Trading
```
1. GET /api/marketplace               → View active listings
2. POST /api/marketplace/list         → List token for sale
3. POST /api/marketplace/buy          → Buy listed token
```

### Scenario 6: Cross-Chain Operations
```
1. GET /api/crosschain/supported      → Get supported networks
2. POST /api/crosschain/transfer      → Initiate cross-chain transfer
```

## 🛠️ **Development Testing**

### Create Test Data (Dev Mode Only)
```
1. POST /api/test/create-property     → Create test property
2. POST /api/test/mint-tokens         → Mint test tokens
3. POST /api/test/reset               → Reset all test data
```

## 🔧 **Environment Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API server URL | `http://localhost:3001` |
| `userAddress` | Test wallet address | `0x742d35Cc...` |
| `propertyId` | Property ID for testing | `1` |
| `tokenId` | Token ID for testing | `1` |
| `authToken` | JWT token (if auth enabled) | `eyJhbGciOiJS...` |
| `contractAddress` | Deployed contract address | `0xContractAddr...` |

## 📊 **Expected Response Formats**

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully"
}
```

### Error Response  
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {}
  }
}
```

### Property Object
```json
{
  "id": 1,
  "propertyId": "PROP-001", 
  "totalValue": "1000000000000000000000000",
  "tokenPrice": "1000000000000000000000",
  "totalTokens": 1000,
  "mintedTokens": 250,
  "isActive": true,
  "metadataURI": "ipfs://QmPropertyData",
  "owners": ["0x123...", "0x456..."]
}
```

### User Portfolio
```json
{
  "address": "0x742d35Cc6664C4532123C75F51C69c6CBc12345a",
  "totalTokens": 15,
  "totalValueUSD": "15000",
  "totalValueETH": "7.5",
  "properties": [
    {
      "propertyId": 1,
      "tokensOwned": 10,
      "valueUSD": "10000",
      "isCollateralized": true
    }
  ],
  "aavePosition": {
    "suppliedAmount": "10000",
    "borrowedAmount": "5000", 
    "healthFactor": 85
  },
  "claimableYield": "125.50"
}
```

## 🚨 **Common Issues & Solutions**

### Issue: "Connection Refused" 
**Solution**: Ensure API server is running (`npm run start:api`)

### Issue: "Invalid Address Format"
**Solution**: Use checksummed Ethereum address format (0x...)

### Issue: "Insufficient Funds"
**Solution**: Use test tokens via `POST /api/test/mint-tokens`

### Issue: "Property Not Found"
**Solution**: Create test property via `POST /api/test/create-property`

## 🎯 **Testing Tips**

1. **Always test Health Check first** to verify server connectivity
2. **Use sequential testing** - start with basic GET requests before POST operations  
3. **Check response times** - should be under 2-3 seconds for most operations
4. **Validate data integrity** - ensure returned values match expected formats
5. **Test error cases** - try invalid addresses, missing parameters, etc.

## 📝 **Test Checklist**

### Basic Functionality ✅
- [ ] Server health check passes
- [ ] Can retrieve property list  
- [ ] Can get property details
- [ ] Can fetch user portfolio
- [ ] Price feeds are working

### Aave Integration ✅
- [ ] Can supply tokens as collateral
- [ ] Can borrow against collateral
- [ ] Position health factor calculated correctly
- [ ] Can repay loans
- [ ] Can withdraw collateral

### Marketplace ✅  
- [ ] Can list tokens for sale
- [ ] Can purchase listed tokens
- [ ] Trading fees calculated correctly
- [ ] Can't trade collateralized tokens

### Yield System ✅
- [ ] Yield accumulates over time
- [ ] Can claim accumulated yield
- [ ] Yield distributed proportionally

### Cross-Chain ✅
- [ ] Can get supported networks
- [ ] Can initiate cross-chain transfers
- [ ] Transfer status tracking works

---

## 🚀 **Ready to Test!**

1. **Import the Postman collection** (`Lotwise-API-Collection.json`)
2. **Import the environment** (`Lotwise-Environment.json`) 
3. **Start the API server** (`npm run start:api`)
4. **Begin with Health Check** to verify everything is working
5. **Follow the test scenarios** above for comprehensive testing

**Happy Testing! 🧪✨**
