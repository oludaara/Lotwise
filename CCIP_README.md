# Chainlink CCIP Cross-Chain Transfer Implementation

## Overview

This implementation adds secure cross-chain transfer functionality to the Lotwise platform using Chainlink's Cross-Chain Interoperability Protocol (CCIP). Users can now transfer their fractional real estate tokens between supported blockchain networks.

## Supported Networks

- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Avalanche C-Chain** (Chain ID: 43114)
- **Sepolia Testnet** (Chain ID: 11155111)
- **Mumbai Testnet** (Chain ID: 80001)
- **Fuji Testnet** (Chain ID: 43113)

## Key Features

### 🔗 Cross-Chain Transfer

- Secure token transfers between supported networks (ETH, Polygon, AVAX)
- Automatic token burning on source chain and minting on destination chain
- Real-time transfer status tracking
- Fee estimation before transfer

### 🛡️ Security Features

- Transfer validation and restrictions
- Prevention of double-spending
- Support for failed transfer recovery
- Chain-specific router validation

### 💰 Fee Management

- Dynamic fee calculation based on destination chain
- Support for native token fee payments
- Gas estimation for transfer costs

## Smart Contract Functions

### Core Transfer Functions

#### `transferCrossChain(uint256 tokenId, uint64 destinationChain, address recipient)`

Initiates a cross-chain transfer of a token.

**Parameters:**

- `tokenId`: The token ID to transfer
- `destinationChain`: Chain ID of the destination network
- `recipient`: Address on the destination chain

**Requirements:**

- Caller must own the token
- Token must not be used as collateral
- Token must not be listed for sale
- Destination chain must be supported and different from current chain

#### `getCCIPFee(uint256 tokenId, uint64 destinationChain, address recipient)`

Estimates the CCIP fee for a cross-chain transfer.

**Returns:** Estimated fee in native tokens

#### `getTransferStatus(bytes32 messageId)`

Gets the status of a cross-chain transfer.

**Returns:** Transfer details including status, fees, and timestamps

### Admin Functions

#### `updateChainRouter(uint64 chainId, address router)`

Updates the CCIP router address for a specific chain (owner only).

#### `setChainSupport(uint64 chainId, bool supported)`

Enables or disables support for a specific chain (owner only).

## API Endpoints

### Get Supported Chains

```http
GET /api/crosschain/supported
```

**Response:**

```json
{
  "supportedChains": [
    {
      "chainId": 1,
      "name": "Ethereum",
      "symbol": "ETH",
      "active": true,
      "routerAddress": "0xE561d5E02207fb5eB32cca20a699E0d8919a1476",
      "ccipEnabled": true
    }
  ]
}
```

### Estimate Transfer Fee

```http
GET /api/crosschain/fee?tokenId=1&destinationChain=137&recipient=0x...
```

**Response:**

```json
{
  "success": true,
  "tokenId": 1,
  "destinationChain": 137,
  "recipient": "0x...",
  "estimatedFee": "0.01",
  "estimatedTime": "5-10 minutes",
  "feeCurrency": "MATIC"
}
```

### Initiate Transfer

```http
POST /api/crosschain/transfer
```

**Request Body:**

```json
{
  "tokenId": 1,
  "destinationChain": 137,
  "recipient": "0x...",
  "fee": "0.01"
}
```

**Response:**

```json
{
  "success": true,
  "transferId": "0x...",
  "messageId": "0x...",
  "tokenId": 1,
  "fromChain": 11155111,
  "toChain": 137,
  "from": "0x...",
  "to": "0x...",
  "fee": "0.01",
  "status": "pending",
  "estimatedTime": "5-10 minutes",
  "message": "Cross-chain transfer initiated via Chainlink CCIP"
}
```

### Get Transfer Status

```http
GET /api/crosschain/transfer/:transferId
```

**Response:**

```json
{
  "success": true,
  "transfer": {
    "transferId": "0x...",
    "messageId": "0x...",
    "tokenId": 1,
    "fromChain": 11155111,
    "toChain": 137,
    "from": "0x...",
    "to": "0x...",
    "status": "completed",
    "fee": "0.01",
    "initiatedAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:08:00.000Z"
  }
}
```

### List All Transfers

```http
GET /api/crosschain/transfers?status=pending&chain=137
```

**Response:**

```json
{
  "success": true,
  "transfers": [...],
  "total": 5
}
```

### Estimate Gas

```http
POST /api/crosschain/estimate-gas
```

**Request Body:**

```json
{
  "tokenId": 1,
  "destinationChain": 137,
  "recipient": "0x..."
}
```

**Response:**

```json
{
  "success": true,
  "tokenId": 1,
  "destinationChain": 137,
  "recipient": "0x...",
  "gasEstimate": {
    "gasLimit": 300000,
    "gasPrice": "30000000000"
  },
  "estimatedCost": "0.009",
  "currency": "MATIC"
}
```

## Deployment Configuration

### Network-Specific Router Addresses

| Network          | Chain ID | Router Address                             |
| ---------------- | -------- | ------------------------------------------ |
| Ethereum Mainnet | 1        | 0xE561d5E02207fb5eB32cca20a699E0d8919a1476 |
| Polygon          | 137      | 0x3C3D92629A02a8D95D5CB9650fe49C3544f69B43 |
| Sepolia          | 11155111 | 0xD0daae2231E9CB96b94C8512223533293C3693Bf |
| Mumbai           | 80001    | 0x70499c328e1E2a3c4d6fC7C8C8C8C8C8C8C8C8C8 |

### Deployment Parameters

The contract constructor now requires a CCIP router address:

```javascript
const lotwise = await Lotwise.deploy(
  ethUsdPriceFeed,
  maticUsdPriceFeed,
  currentChain,
  ccipRouter // New parameter
);
```

## Testing

Run the CCIP tests:

```bash
npm test test/CCIP-test.js
```

## Security Considerations

1. **Router Validation**: Only authorized CCIP routers are accepted
2. **Chain Support**: Transfers are restricted to supported chains
3. **Token State**: Tokens used as collateral or listed for sale cannot be transferred
4. **Ownership Verification**: Only token owners can initiate transfers
5. **Fee Validation**: Fees are validated against router estimates

## Error Handling

The implementation includes comprehensive error handling for:

- Unsupported destination chains
- Invalid token states (collateralized, listed)
- Insufficient fees
- Failed transfers
- Invalid recipient addresses

## Monitoring and Events

### Smart Contract Events

- `CrossChainTransferInitiated`: Emitted when transfer is initiated
- `CrossChainTransferCompleted`: Emitted when transfer completes
- `CrossChainTransferFailed`: Emitted when transfer fails

### API Monitoring

The API provides real-time status updates and transfer tracking through dedicated endpoints.

## Future Enhancements

1. **Batch Transfers**: Support for transferring multiple tokens in a single transaction
2. **Advanced Routing**: Dynamic router selection based on fees and network conditions
3. **Transfer Scheduling**: Scheduled cross-chain transfers
4. **Enhanced Recovery**: More sophisticated failed transfer recovery mechanisms
5. **Multi-Chain Support**: Expansion to additional blockchain networks

## Dependencies

- `@chainlink/contracts-ccip`: ^0.6.1
- `@chainlink/contracts`: ^0.6.1
- `@openzeppelin/contracts`: ^4.9.0

## Support

For technical support or questions about the CCIP implementation, please refer to:

- [Chainlink CCIP Documentation](https://docs.chain.link/ccip)
- [Lotwise API Documentation](README.md)
- [Smart Contract Documentation](contracts/Lotwise.sol)
