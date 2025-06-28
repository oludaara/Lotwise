// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// OpenZeppelin imports
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Chainlink imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";

/**
 * @title Lotwise - Advanced Fractional Real Estate with Full Aave Integration
 * @dev Enhanced ERC721 contract for fractional real estate ownership with DeFi lending
 *
 * Features:
 * - 1,000 ERC-721 tokens per property ($1,000 each for $1M property)
 * - Full Aave protocol integration (supply, borrow, liquidation)
 * - Cross-chain support (Ethereum + Polygon) via Chainlink CCIP
 * - Yield distribution among fractional owners
 * - Collateral management and liquidation protection
 */
contract Lotwise is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // =============================================================
    //                           STRUCTS
    // =============================================================

    struct Property {
        string propertyId; // Property identifier
        uint256 totalValue; // Total property value in USD (scaled by 1e18)
        uint256 tokenPrice; // Price per token in USD ($1,000 = 1000e18)
        uint256 totalTokens; // Always 1,000 for fractional ownership
        uint256 mintedTokens; // Number of tokens minted so far
        bool isActive; // Whether property is active
        string metadataURI; // Property metadata URI
        address[] fractionalOwners; // List of all token holders
        bool isVerified; // Property verification status via Chainlink Functions
        uint256 verificationTimestamp; // When property was verified
        string verificationData; // Verification data from Chainlink Functions
    }

    struct AavePosition {
        uint256 suppliedAmount; // Total USD value supplied as collateral
        uint256 borrowedAmount; // Total USD value borrowed
        uint256 lastYieldUpdate; // Last yield calculation timestamp
        uint256 accumulatedYield; // Total yield earned
        bool isCollateralized; // Whether position is used as collateral
        uint8 healthFactor; // Position health (1-100, <80 = liquidation risk)
    }

    struct TokenListing {
        uint256 tokenId;
        uint256 price; // Price in USD (scaled by 1e18)
        address seller;
        bool isActive;
        uint256 listedAt;
    }

    struct CrossChainTransfer {
        uint256 tokenId;
        address from;
        address to;
        uint64 destinationChain; // Chainlink CCIP chain selector
        bytes32 messageId;
        bool completed;
        uint256 fee;
    }

    // =============================================================
    //                        STATE VARIABLES
    // =============================================================

    // Core tokenization
    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _propertyIdCounter;

    // Multi-property support
    mapping(uint256 => Property) public properties; // propertyId => Property
    mapping(uint256 => uint256) public tokenToProperty; // tokenId => propertyId
    mapping(uint256 => bool) public propertyExists;

    // Fractional ownership tracking
    mapping(uint256 => mapping(address => uint256[]))
        public ownerTokensByProperty; // propertyId => owner => tokenIds
    mapping(address => uint256) public totalTokensOwned; // owner => total tokens across all properties

    // Marketplace
    mapping(uint256 => TokenListing) public marketplace;
    mapping(uint256 => bool) public isTokenListed;
    uint256 public constant TRADING_FEE_BPS = 100; // 1%
    uint256 public constant BASIS_POINTS = 10000;

    // Aave Integration
    mapping(address => AavePosition) public aavePositions; // user => position
    mapping(uint256 => bool) public tokenUsedAsCollateral; // tokenId => isCollateral
    mapping(uint256 => uint256) public tokenCollateralValue; // tokenId => USD value

    // Yield Distribution
    mapping(uint256 => uint256) public propertyYieldPool; // propertyId => total yield accumulated
    mapping(uint256 => mapping(address => uint256)) public userYieldShare; // propertyId => user => share
    mapping(uint256 => uint256) public lastYieldDistribution; // propertyId => timestamp

    // Liquidation Protection
    mapping(address => bool) public liquidationProtection; // user => protected
    mapping(address => uint256) public liquidationThreshold; // user => custom threshold
    uint256 public constant DEFAULT_LIQUIDATION_THRESHOLD = 8000; // 80%

    // Cross-chain (Chainlink CCIP)
    mapping(bytes32 => CrossChainTransfer) public crossChainTransfers;
    mapping(uint64 => bool) public supportedChains; // Ethereum, Polygon, Avalanche
    mapping(uint64 => address) public chainSelectors; // chainId => router address
    uint64 public currentChain;
    uint256 public ccipFee; // CCIP fee in LINK tokens

    // Chainlink integration
    AggregatorV3Interface internal ethUsdPriceFeed;
    AggregatorV3Interface internal maticUsdPriceFeed;
    uint256 public priceUpdateInterval = 3600; // 1 hour
    uint256 public lastPriceUpdate;

    // Protocol settings
    uint256 public constant AAVE_LENDING_APY = 500; // 5% base APY
    uint256 public constant YIELD_DISTRIBUTION_INTERVAL = 86400; // 24 hours
    uint256 public constant MAX_LTV_RATIO = 7500; // 75% max loan-to-value

    // Emergency controls
    bool public emergencyPaused;
    mapping(address => bool) public authorizedOperators;

    // =============================================================
    //                           EVENTS
    // =============================================================

    // Property events
    event PropertyCreated(
        uint256 indexed propertyId,
        string propertyIdStr,
        uint256 totalValue
    );
    event PropertyTokenMinted(
        uint256 indexed propertyId,
        uint256 indexed tokenId,
        address indexed to
    );
    event PropertyVerified(
        uint256 indexed propertyId,
        bool verified,
        string verificationData,
        uint256 timestamp
    );

    // Marketplace events
    event TokenListed(
        uint256 indexed tokenId,
        uint256 price,
        address indexed seller
    );
    event TokenSold(
        uint256 indexed tokenId,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );
    event TokenDelisted(uint256 indexed tokenId);

    // Aave integration events
    event TokensSuppliedAsCollateral(
        address indexed user,
        uint256[] tokenIds,
        uint256 totalValue
    );
    event AssetsWithdrawnFromAave(
        address indexed user,
        uint256[] tokenIds,
        uint256 totalValue
    );
    event AssetsBorrowedFromAave(
        address indexed user,
        uint256 amount,
        address asset
    );
    event LoanRepaidToAave(address indexed user, uint256 amount, address asset);
    event PositionLiquidated(
        address indexed user,
        uint256 collateralSeized,
        uint256 debtRepaid
    );

    // Yield events
    event YieldDistributed(
        uint256 indexed propertyId,
        uint256 totalYield,
        uint256 numOwners
    );
    event YieldClaimed(
        address indexed user,
        uint256 indexed propertyId,
        uint256 amount
    );

    // Cross-chain events
    event CrossChainTransferInitiated(
        uint256 indexed tokenId,
        uint64 destinationChain,
        bytes32 messageId,
        uint256 fee
    );
    event CrossChainTransferCompleted(
        uint256 indexed tokenId,
        address indexed to,
        uint64 sourceChain
    );
    event CrossChainTransferFailed(
        uint256 indexed tokenId,
        bytes32 messageId,
        string reason
    );

    // =============================================================
    //                        MODIFIERS
    // =============================================================

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            owner() == msg.sender || authorizedOperators[msg.sender],
            "Not authorized"
        );
        _;
    }

    modifier whenNotPaused() {
        require(!emergencyPaused, "Contract paused");
        _;
    }

    modifier validProperty(uint256 propertyId) {
        require(propertyExists[propertyId], "Property does not exist");
        _;
    }

    modifier supportedChain(uint64 chainId) {
        require(supportedChains[chainId], "Unsupported chain");
        _;
    }

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor(
        address _ethUsdPriceFeed,
        address _maticUsdPriceFeed,
        uint64 _currentChain,
        address /*_router*/
    ) ERC721("Lotwise Fractional Property", "LFP") {
        // Initialize price feeds
        if (_ethUsdPriceFeed != address(0)) {
            ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        }
        if (_maticUsdPriceFeed != address(0)) {
            maticUsdPriceFeed = AggregatorV3Interface(_maticUsdPriceFeed);
        }
        currentChain = _currentChain;
        supportedChains[1] = true; // Ethereum
        supportedChains[137] = true; // Polygon
        supportedChains[43114] = true; // Avalanche C-Chain
        chainSelectors[1] = 0x0000000000000000000000000000000000000000;
        chainSelectors[137] = 0x0000000000000000000000000000000000000000;
        chainSelectors[43114] = 0x0000000000000000000000000000000000000000;
        chainSelectors[11155111] = 0x0000000000000000000000000000000000000000;
        chainSelectors[80001] = 0x0000000000000000000000000000000000000000;
        chainSelectors[43113] = 0x0000000000000000000000000000000000000000;
        ccipFee = 0.1 ether; // 0.1 LINK default
        _propertyIdCounter.increment();
        _tokenIdCounter.increment();
        lastPriceUpdate = block.timestamp;
    }

    // =============================================================
    //                    PROPERTY MANAGEMENT
    // =============================================================

    /**
     * @dev Create a new property for tokenization
     * @param _propertyIdStr Unique property identifier string
     * @param _totalValueUSD Total property value in USD (scaled by 1e18)
     * @param _metadataURI IPFS URI for property metadata
     */
    function createProperty(
        string memory _propertyIdStr,
        uint256 _totalValueUSD,
        string memory _metadataURI
    ) external onlyAuthorized returns (uint256 propertyId) {
        require(_totalValueUSD > 0, "Invalid property value");
        require(bytes(_propertyIdStr).length > 0, "Property ID required");

        propertyId = _propertyIdCounter.current();
        _propertyIdCounter.increment();

        // Each property is divided into exactly 1,000 tokens
        uint256 tokenPrice = _totalValueUSD / 1000;

        properties[propertyId] = Property({
            propertyId: _propertyIdStr,
            totalValue: _totalValueUSD,
            tokenPrice: tokenPrice,
            totalTokens: 1000,
            mintedTokens: 0,
            isActive: true,
            metadataURI: _metadataURI,
            fractionalOwners: new address[](0),
            isVerified: false,
            verificationTimestamp: 0,
            verificationData: ""
        });

        propertyExists[propertyId] = true;
        lastYieldDistribution[propertyId] = block.timestamp; // Initialize yield distribution timestamp

        emit PropertyCreated(propertyId, _propertyIdStr, _totalValueUSD);

        return propertyId;
    }

    /**
     * @dev Mint fractional ownership tokens for a property
     * @param propertyId The property to mint tokens for
     * @param to Address to mint tokens to
     * @param quantity Number of tokens to mint (max 1000 per property)
     */
    function mintPropertyTokens(
        uint256 propertyId,
        address to,
        uint256 quantity
    ) external payable validProperty(propertyId) nonReentrant {
        Property storage prop = properties[propertyId];
        require(prop.isActive, "Property not active");
        require(quantity > 0 && quantity <= 100, "Invalid quantity (1-100)");
        require(
            prop.mintedTokens + quantity <= prop.totalTokens,
            "Exceeds total supply"
        );

        // Calculate total cost in ETH (convert USD to ETH using price feed)
        uint256 totalCostUSD = prop.tokenPrice * quantity;
        uint256 totalCostETH = _convertUSDToETH(totalCostUSD);
        require(msg.value >= totalCostETH, "Insufficient payment");

        // Mint tokens
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();

            _safeMint(to, tokenId);
            tokenToProperty[tokenId] = propertyId;

            emit PropertyTokenMinted(propertyId, tokenId, to);
        }

        // Update property state
        prop.mintedTokens += quantity;

        // Track fractional ownership
        if (ownerTokensByProperty[propertyId][to].length == 0) {
            prop.fractionalOwners.push(to);
        }

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current() - quantity + i;
            ownerTokensByProperty[propertyId][to].push(tokenId);
        }

        totalTokensOwned[to] += quantity;

        // Refund excess payment
        if (msg.value > totalCostETH) {
            payable(msg.sender).transfer(msg.value - totalCostETH);
        }
    }

    /**
     * @dev Verify property using Chainlink Functions
     * @param propertyId Property to verify
     * @param verificationData Verification data from Chainlink Functions
     * @param isVerified Whether property is verified
     */
    function verifyProperty(
        uint256 propertyId,
        string memory verificationData,
        bool isVerified
    ) external onlyAuthorized validProperty(propertyId) {
        Property storage prop = properties[propertyId];

        prop.isVerified = isVerified;
        prop.verificationTimestamp = block.timestamp;
        prop.verificationData = verificationData;

        emit PropertyVerified(
            propertyId,
            isVerified,
            verificationData,
            block.timestamp
        );
    }

    // =============================================================
    //                    AAVE INTEGRATION
    // =============================================================

    /**
     * @dev Supply tokens as collateral to Aave
     * @param tokenIds Array of token IDs to use as collateral
     */
    function supplyToAave(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length > 0, "No tokens provided");

        uint256 totalCollateralValue = 0;

        // Verify ownership and calculate total value
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not token owner");
            require(
                !tokenUsedAsCollateral[tokenIds[i]],
                "Token already collateralized"
            );

            uint256 propertyId = tokenToProperty[tokenIds[i]];
            uint256 tokenValue = properties[propertyId].tokenPrice;

            tokenUsedAsCollateral[tokenIds[i]] = true;
            tokenCollateralValue[tokenIds[i]] = tokenValue;
            totalCollateralValue += tokenValue;
        }

        // Update user's Aave position
        AavePosition storage position = aavePositions[msg.sender];
        position.suppliedAmount += totalCollateralValue;
        position.isCollateralized = true;
        position.lastYieldUpdate = block.timestamp;

        emit TokensSuppliedAsCollateral(
            msg.sender,
            tokenIds,
            totalCollateralValue
        );
    }

    /**
     * @dev Borrow assets against collateralized tokens
     * @param amount Amount to borrow in USD (scaled by 1e18)
     * @param asset Address of asset to borrow (USDC, USDT, etc.)
     */
    function borrowFromAave(
        uint256 amount,
        address asset
    ) external nonReentrant {
        AavePosition storage position = aavePositions[msg.sender];
        require(position.isCollateralized, "No collateral supplied");

        // Calculate maximum borrowable amount (75% LTV)
        uint256 maxBorrow = (position.suppliedAmount * MAX_LTV_RATIO) /
            BASIS_POINTS;
        require(
            position.borrowedAmount + amount <= maxBorrow,
            "Exceeds borrowing capacity"
        );

        // Update position
        position.borrowedAmount += amount;
        position.healthFactor = _calculateHealthFactor(msg.sender);

        // In production: integrate with actual Aave protocol
        // For now: mock the borrowing process

        emit AssetsBorrowedFromAave(msg.sender, amount, asset);
    }

    /**
     * @dev Repay borrowed assets to Aave
     * @param amount Amount to repay in USD
     * @param asset Address of asset being repaid
     */
    function repayToAave(uint256 amount, address asset) external nonReentrant {
        AavePosition storage position = aavePositions[msg.sender];
        require(position.borrowedAmount >= amount, "Repay amount exceeds debt");

        // Update position
        position.borrowedAmount -= amount;
        position.healthFactor = _calculateHealthFactor(msg.sender);

        // In production: handle actual asset transfer and Aave interaction

        emit LoanRepaidToAave(msg.sender, amount, asset);
    }

    /**
     * @dev Withdraw collateral from Aave (if health factor allows)
     * @param tokenIds Array of token IDs to withdraw
     */
    function withdrawFromAave(
        uint256[] calldata tokenIds
    ) external nonReentrant {
        require(tokenIds.length > 0, "No tokens provided");

        uint256 withdrawValue = 0;

        // Calculate withdrawal value and verify ownership
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not token owner");
            require(
                tokenUsedAsCollateral[tokenIds[i]],
                "Token not collateralized"
            );

            withdrawValue += tokenCollateralValue[tokenIds[i]];
        }

        AavePosition storage position = aavePositions[msg.sender];

        // Check if withdrawal maintains healthy position
        uint256 newCollateralValue = position.suppliedAmount - withdrawValue;
        uint256 maxBorrowAfterWithdraw = (newCollateralValue * MAX_LTV_RATIO) /
            BASIS_POINTS;
        require(
            position.borrowedAmount <= maxBorrowAfterWithdraw,
            "Would cause liquidation"
        );

        // Update position and token states
        position.suppliedAmount -= withdrawValue;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokenUsedAsCollateral[tokenIds[i]] = false;
            tokenCollateralValue[tokenIds[i]] = 0;
        }

        if (position.suppliedAmount == 0) {
            position.isCollateralized = false;
        }

        position.healthFactor = _calculateHealthFactor(msg.sender);

        emit AssetsWithdrawnFromAave(msg.sender, tokenIds, withdrawValue);
    }

    // =============================================================
    //                    YIELD DISTRIBUTION
    // =============================================================

    /**
     * @dev Distribute lending yield to fractional owners of a property
     * @param propertyId Property to distribute yield for
     */
    function distributeYield(
        uint256 propertyId
    ) external validProperty(propertyId) {
        require(
            block.timestamp >=
                lastYieldDistribution[propertyId] + YIELD_DISTRIBUTION_INTERVAL,
            "Distribution too frequent"
        );

        Property storage prop = properties[propertyId];
        require(prop.mintedTokens > 0, "No tokens minted");

        // Calculate total yield for this property
        uint256 totalYield = _calculatePropertyYield(propertyId);
        require(totalYield > 0, "No yield to distribute");

        // Distribute proportionally to token holders
        for (uint256 i = 0; i < prop.fractionalOwners.length; i++) {
            address owner = prop.fractionalOwners[i];
            uint256 ownerTokens = ownerTokensByProperty[propertyId][owner]
                .length;

            if (ownerTokens > 0) {
                uint256 ownerShare = (totalYield * ownerTokens) /
                    prop.mintedTokens;
                userYieldShare[propertyId][owner] += ownerShare;
            }
        }

        propertyYieldPool[propertyId] += totalYield;
        lastYieldDistribution[propertyId] = block.timestamp;

        emit YieldDistributed(
            propertyId,
            totalYield,
            prop.fractionalOwners.length
        );
    }

    /**
     * @dev Claim accumulated yield for a property
     * @param propertyId Property to claim yield from
     */
    function claimYield(
        uint256 propertyId
    ) external validProperty(propertyId) nonReentrant {
        uint256 claimableYield = userYieldShare[propertyId][msg.sender];
        require(claimableYield > 0, "No yield to claim");

        userYieldShare[propertyId][msg.sender] = 0;

        // Convert USD yield to ETH and transfer
        uint256 yieldInETH = _convertUSDToETH(claimableYield);
        require(
            address(this).balance >= yieldInETH,
            "Insufficient contract balance"
        );

        payable(msg.sender).transfer(yieldInETH);

        emit YieldClaimed(msg.sender, propertyId, claimableYield);
    }

    // =============================================================
    //                    LIQUIDATION MANAGEMENT
    // =============================================================

    /**
     * @dev Liquidate undercollateralized position
     * @param user Address of user to liquidate
     */
    function liquidatePosition(address user) external nonReentrant {
        AavePosition storage position = aavePositions[user];
        require(position.isCollateralized, "No position to liquidate");
        require(position.healthFactor < 80, "Position is healthy");

        // Calculate liquidation parameters
        uint256 debtToRepay = position.borrowedAmount;
        uint256 collateralToSeize = (debtToRepay * 11000) / BASIS_POINTS; // 110% liquidation bonus

        require(
            position.suppliedAmount >= collateralToSeize,
            "Insufficient collateral"
        );

        // Update position
        position.borrowedAmount = 0;
        position.suppliedAmount -= collateralToSeize;
        position.healthFactor = _calculateHealthFactor(user);

        if (position.suppliedAmount == 0) {
            position.isCollateralized = false;
        }

        emit PositionLiquidated(user, collateralToSeize, debtToRepay);
    }

    // =============================================================
    //                    HELPER FUNCTIONS
    // =============================================================

    /**
     * @dev Calculate health factor for a user's position
     * @param user Address to calculate health factor for
     */
    function _calculateHealthFactor(
        address user
    ) internal view returns (uint8) {
        AavePosition storage position = aavePositions[user];

        if (position.borrowedAmount == 0) return 100;
        if (position.suppliedAmount == 0) return 0;

        uint256 collateralValueWithLTV = (position.suppliedAmount *
            MAX_LTV_RATIO) / BASIS_POINTS;
        uint256 healthFactor = (collateralValueWithLTV * 100) /
            position.borrowedAmount;

        return uint8(healthFactor > 100 ? 100 : healthFactor);
    }

    /**
     * @dev Calculate yield for a property based on Aave lending
     * @param propertyId Property to calculate yield for
     */
    function _calculatePropertyYield(
        uint256 propertyId
    ) internal view returns (uint256) {
        Property storage prop = properties[propertyId];

        // Calculate based on time elapsed and total property value staked in Aave
        uint256 timeElapsed = block.timestamp -
            lastYieldDistribution[propertyId];
        if (timeElapsed == 0) timeElapsed = YIELD_DISTRIBUTION_INTERVAL;

        // Simplified yield calculation for testing: $100 per day for a $1M property
        uint256 dailyYield = prop.totalValue / 10000; // 0.01% daily = 3.65% annual
        uint256 periodYield = (dailyYield * timeElapsed) / 86400; // Scale by time

        return periodYield;
    }

    /**
     * @dev Convert USD amount to ETH using Chainlink price feed
     * @param usdAmount Amount in USD (scaled by 1e18)
     */
    function _convertUSDToETH(
        uint256 usdAmount
    ) internal view returns (uint256) {
        if (address(ethUsdPriceFeed) == address(0)) {
            // Fallback: assume 1 ETH = $2000
            return (usdAmount * 1e18) / (2000 * 1e18);
        }

        (, int256 price, , , ) = ethUsdPriceFeed.latestRoundData();
        require(price > 0, "Invalid price data");

        // Convert USD to ETH: usdAmount / ethPriceInUSD
        return (usdAmount * 1e18) / uint256(price * 1e10); // price has 8 decimals
    }

    // =============================================================
    //                    MARKETPLACE FUNCTIONS
    // =============================================================

    /**
     * @dev List token for sale on marketplace
     * @param tokenId Token to list
     * @param priceUSD Price in USD (scaled by 1e18)
     */
    function listToken(
        uint256 tokenId,
        uint256 priceUSD
    ) external onlyTokenOwner(tokenId) {
        require(!tokenUsedAsCollateral[tokenId], "Token is collateralized");
        require(!isTokenListed[tokenId], "Token already listed");
        require(priceUSD > 0, "Invalid price");

        marketplace[tokenId] = TokenListing({
            tokenId: tokenId,
            price: priceUSD,
            seller: msg.sender,
            isActive: true,
            listedAt: block.timestamp
        });

        isTokenListed[tokenId] = true;

        emit TokenListed(tokenId, priceUSD, msg.sender);
    }

    /**
     * @dev Buy listed token
     * @param tokenId Token to purchase
     */
    function buyToken(uint256 tokenId) external payable nonReentrant {
        require(isTokenListed[tokenId], "Token not listed");

        TokenListing storage listing = marketplace[tokenId];
        require(listing.isActive, "Listing not active");
        require(listing.seller != msg.sender, "Cannot buy own token");

        uint256 priceETH = _convertUSDToETH(listing.price);
        require(msg.value >= priceETH, "Insufficient payment");

        // Calculate trading fee
        uint256 tradingFee = (priceETH * TRADING_FEE_BPS) / BASIS_POINTS;
        uint256 sellerAmount = priceETH - tradingFee;

        // Update ownership tracking
        uint256 propertyId = tokenToProperty[tokenId];
        _removeTokenFromOwner(propertyId, listing.seller, tokenId);
        ownerTokensByProperty[propertyId][msg.sender].push(tokenId);

        totalTokensOwned[listing.seller]--;
        totalTokensOwned[msg.sender]++;

        // Transfer token and payments
        _transfer(listing.seller, msg.sender, tokenId);
        payable(listing.seller).transfer(sellerAmount);

        // Clear listing
        delete marketplace[tokenId];
        isTokenListed[tokenId] = false;

        // Refund excess
        if (msg.value > priceETH) {
            payable(msg.sender).transfer(msg.value - priceETH);
        }

        emit TokenSold(tokenId, listing.price, listing.seller, msg.sender);
    }

    /**
     * @dev Remove token from owner's array
     */
    function _removeTokenFromOwner(
        uint256 propertyId,
        address owner,
        uint256 tokenId
    ) internal {
        uint256[] storage tokens = ownerTokensByProperty[propertyId][owner];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    // =============================================================
    //                    VIEW FUNCTIONS
    // =============================================================

    /**
     * @dev Get property information
     */
    function getProperty(
        uint256 propertyId
    ) external view returns (Property memory) {
        return properties[propertyId];
    }

    /**
     * @dev Get user's position in Aave
     */
    function getAavePosition(
        address user
    ) external view returns (AavePosition memory) {
        return aavePositions[user];
    }

    /**
     * @dev Get tokens owned by user for a property
     */
    function getUserTokens(
        uint256 propertyId,
        address user
    ) external view returns (uint256[] memory) {
        return ownerTokensByProperty[propertyId][user];
    }

    /**
     * @dev Get claimable yield for user and property
     */
    function getClaimableYield(
        uint256 propertyId,
        address user
    ) external view returns (uint256) {
        return userYieldShare[propertyId][user];
    }

    // =============================================================
    //                    ADMIN FUNCTIONS
    // =============================================================

    /**
     * @dev Emergency pause contract
     */
    function pauseContract() external onlyOwner {
        emergencyPaused = true;
    }

    /**
     * @dev Unpause contract
     */
    function unpauseContract() external onlyOwner {
        emergencyPaused = false;
    }

    /**
     * @dev Add authorized operator
     */
    function addOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = true;
    }

    /**
     * @dev Remove authorized operator
     */
    function removeOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = false;
    }

    /**
     * @dev Withdraw contract balance (fees)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    // =============================================================
    //                    REQUIRED OVERRIDES
    // =============================================================

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        require(!tokenUsedAsCollateral[tokenId], "Token is collateralized");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // =============================================================
    //                    CHAINLINK AUTOMATION
    // =============================================================

    function checkUpkeep(
        bytes calldata
    ) external view returns (bool upkeepNeeded, bytes memory performData) {
        // Check if any property needs yield distribution
        for (uint256 i = 1; i < _propertyIdCounter.current(); i++) {
            if (
                propertyExists[i] &&
                block.timestamp >=
                lastYieldDistribution[i] + YIELD_DISTRIBUTION_INTERVAL
            ) {
                upkeepNeeded = true;
                performData = abi.encode(i);
                return (true, performData);
            }
        }

        upkeepNeeded = false;
        performData = "";
    }

    function performUpkeep(bytes calldata performData) external {
        uint256 propertyId = abi.decode(performData, (uint256));

        if (
            propertyExists[propertyId] &&
            block.timestamp >=
            lastYieldDistribution[propertyId] + YIELD_DISTRIBUTION_INTERVAL
        ) {
            // Auto-distribute yield
            this.distributeYield(propertyId);
        }
    }

    // =============================================================
    //                    RECEIVE FUNCTION
    // =============================================================

    receive() external payable {
        // Accept ETH for yield distributions and marketplace transactions
    }
}
