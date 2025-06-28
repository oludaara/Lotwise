// This file contains all the JSDoc comments for the Lotwise API endpoints
// Copy these comments to the appropriate locations in server.js

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property details
 *     description: Retrieve detailed information about a specific property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property identifier
 *         example: PROP-001
 *     responses:
 *       200:
 *         description: Property details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/properties/{id}/verify:
 *   post:
 *     summary: Verify property
 *     description: Verify property details using Chainlink Functions
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property identifier
 *         example: PROP-001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address, documentHash]
 *             properties:
 *               address:
 *                 type: string
 *                 description: Physical address of the property
 *                 example: "123 Main St, San Francisco, CA"
 *               documentHash:
 *                 type: string
 *                 description: Hash of property documentation
 *                 example: "0x1234567890abcdef"
 *     responses:
 *       200:
 *         description: Property verification initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "verification_initiated"
 *                 requestId:
 *                   type: string
 *                   example: "chainlink_request_123"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/users/{address}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve user profile information
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum address of the user
 *         example: 0x1234567890abcdef1234567890abcdef12345678
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/users/{address}/portfolio:
 *   get:
 *     summary: Get user portfolio
 *     description: Retrieve user's complete portfolio including tokens, collateral, and yields
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum address of the user
 *         example: 0x1234567890abcdef1234567890abcdef12345678
 *     responses:
 *       200:
 *         description: User portfolio retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPortfolio'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/aave/position/{address}:
 *   get:
 *     summary: Get Aave position
 *     description: Get user's current Aave position including collateral and borrowings
 *     tags: [Aave]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum address of the user
 *         example: 0x1234567890abcdef1234567890abcdef12345678
 *     responses:
 *       200:
 *         description: Aave position retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AavePosition'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/aave/supply:
 *   post:
 *     summary: Supply tokens as collateral
 *     description: Supply property tokens as collateral to Aave protocol
 *     tags: [Aave]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplyRequest'
 *     responses:
 *       200:
 *         description: Tokens supplied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "5 tokens supplied as collateral"
 *                 transactionHash:
 *                   type: string
 *                   example: "0xabc123..."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/aave/borrow:
 *   post:
 *     summary: Borrow against collateral
 *     description: Borrow assets against collateralized tokens
 *     tags: [Aave]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BorrowRequest'
 *     responses:
 *       200:
 *         description: Borrow transaction successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Borrowed 1000 USDC successfully"
 *                 transactionHash:
 *                   type: string
 *                   example: "0xdef456..."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/aave/repay:
 *   post:
 *     summary: Repay loan
 *     description: Repay borrowed assets
 *     tags: [Aave]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RepayRequest'
 *     responses:
 *       200:
 *         description: Repay transaction successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Repaid 500 USDC successfully"
 *                 transactionHash:
 *                   type: string
 *                   example: "0xghi789..."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/aave/withdraw:
 *   post:
 *     summary: Withdraw collateral
 *     description: Withdraw collateral tokens from Aave
 *     tags: [Aave]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WithdrawRequest'
 *     responses:
 *       200:
 *         description: Withdraw transaction successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Withdrawn 2 tokens from collateral"
 *                 transactionHash:
 *                   type: string
 *                   example: "0xjkl012..."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/yield/{propertyId}:
 *   get:
 *     summary: Get property yield info
 *     description: Get yield information for a specific property
 *     tags: [Yield]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Property identifier
 *         example: PROP-001
 *     responses:
 *       200:
 *         description: Property yield information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YieldInfo'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/yield/{propertyId}/{address}:
 *   get:
 *     summary: Get user claimable yield
 *     description: Get claimable yield for a user on a specific property
 *     tags: [Yield]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Property identifier
 *         example: PROP-001
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: User address
 *         example: 0x1234567890abcdef1234567890abcdef12345678
 *     responses:
 *       200:
 *         description: User claimable yield retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserYieldInfo'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/yield/claim:
 *   post:
 *     summary: Claim yield
 *     description: Claim accumulated yield for a property
 *     tags: [Yield]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClaimYieldRequest'
 *     responses:
 *       200:
 *         description: Yield claimed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Claimed 125 USD in yield"
 *                 transactionHash:
 *                   type: string
 *                   example: "0xmno345..."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/marketplace:
 *   get:
 *     summary: Get marketplace listings
 *     description: Get all active token listings in the marketplace
 *     tags: [Marketplace]
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Filter by property ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: Marketplace listings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MarketplaceListing'
 *                 total:
 *                   type: number
 *                   example: 2
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/marketplace/list:
 *   post:
 *     summary: List token for sale
 *     description: List a token for sale in the marketplace
 *     tags: [Marketplace]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tokenId, price, userAddress]
 *             properties:
 *               tokenId:
 *                 type: number
 *                 description: Token ID to list
 *                 example: 1
 *               price:
 *                 type: string
 *                 description: Listing price in USD
 *                 example: "1100"
 *               userAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Seller address
 *                 example: 0x1234567890abcdef1234567890abcdef12345678
 *     responses:
 *       201:
 *         description: Token listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token listed for sale"
 *                 listingId:
 *                   type: number
 *                   example: 3
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/marketplace/buy:
 *   post:
 *     summary: Buy listed token
 *     description: Purchase a listed token from the marketplace
 *     tags: [Marketplace]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tokenId, buyerAddress]
 *             properties:
 *               tokenId:
 *                 type: number
 *                 description: Token ID to purchase
 *                 example: 1
 *               buyerAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Buyer address
 *                 example: 0x1234567890abcdef1234567890abcdef12345678
 *     responses:
 *       200:
 *         description: Token purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token purchased successfully"
 *                 transactionHash:
 *                   type: string
 *                   example: "0xpqr678..."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/crosschain/supported:
 *   get:
 *     summary: Get supported networks
 *     description: Get list of supported cross-chain networks
 *     tags: [Cross-Chain]
 *     responses:
 *       200:
 *         description: Supported networks retrieved successfully
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
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Ethereum"
 *                       symbol:
 *                         type: string
 *                         example: "ETH"
 *                       ccipSelector:
 *                         type: string
 *                         example: "5009297550715157269"
 *                       active:
 *                         type: boolean
 *                         example: true
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/crosschain/transfer:
 *   post:
 *     summary: Initiate cross-chain transfer
 *     description: Initiate cross-chain token transfer using Chainlink CCIP
 *     tags: [Cross-Chain]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tokenId, destinationChain, recipientAddress, senderAddress]
 *             properties:
 *               tokenId:
 *                 type: number
 *                 description: Token ID to transfer
 *                 example: 1
 *               destinationChain:
 *                 type: string
 *                 description: Destination chain name
 *                 example: "polygon"
 *               recipientAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Recipient address on destination chain
 *                 example: 0x1234567890abcdef1234567890abcdef12345678
 *               senderAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: Sender address
 *                 example: 0x1234567890abcdef1234567890abcdef12345678
 *     responses:
 *       200:
 *         description: Cross-chain transfer initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cross-chain transfer initiated"
 *                 ccipMessageId:
 *                   type: string
 *                   example: "0xccip123..."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/analytics/platform:
 *   get:
 *     summary: Get platform analytics
 *     description: Get overall platform statistics and analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Platform analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProperties:
 *                   type: number
 *                   example: 2
 *                 totalTokens:
 *                   type: number
 *                   example: 1200
 *                 totalValueLocked:
 *                   type: number
 *                   example: 3500000
 *                 totalSuppliedToAave:
 *                   type: number
 *                   example: 650000
 *                 totalBorrowedFromAave:
 *                   type: number
 *                   example: 450000
 *                 averageAPY:
 *                   type: number
 *                   example: 5.0
 *                 totalYieldDistributed:
 *                   type: number
 *                   example: 31500
 *                 activeUsers:
 *                   type: number
 *                   example: 3
 *                 totalTransactions:
 *                   type: number
 *                   example: 156
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/prices/current:
 *   get:
 *     summary: Get current prices
 *     description: Get current ETH/USD and other price feed data
 *     tags: [Prices]
 *     responses:
 *       200:
 *         description: Current prices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ETH:
 *                   $ref: '#/components/schemas/PriceData'
 *                 MATIC:
 *                   $ref: '#/components/schemas/PriceData'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/prices/history:
 *   get:
 *     summary: Get price history
 *     description: Get historical price data
 *     tags: [Prices]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days of history to retrieve
 *     responses:
 *       200:
 *         description: Price history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         example: "2024-01-01"
 *                       ethPrice:
 *                         type: number
 *                         example: 2000
 *                       maticPrice:
 *                         type: number
 *                         example: 0.8
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/liquidation/risks:
 *   get:
 *     summary: Get liquidation risks
 *     description: Get users at risk of liquidation
 *     tags: [Liquidation]
 *     responses:
 *       200:
 *         description: Liquidation risks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 riskyPositions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       address:
 *                         type: string
 *                         example: "0x1234...abcd"
 *                       healthFactor:
 *                         type: number
 *                         example: 75
 *                       liquidationThreshold:
 *                         type: number
 *                         example: 80
 *                       riskLevel:
 *                         type: string
 *                         enum: [low, medium, high, critical]
 *                         example: "medium"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
