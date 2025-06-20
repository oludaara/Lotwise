// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Chainlink imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

/**
 * @title Lotwise - Tokenized Real Estate with Chainlink & DeFi
 * @dev ERC721 contract for fractional real estate ownership
 * Week 1 MVP: Basic tokenization, buying, and trading
 * Week 2: Chainlink integration (Functions, CCIP, Data Feeds, Automation) + Aave DeFi
 */
contract Lotwise is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard, AutomationCompatibleInterface {
    using Counters for Counters.Counter;

    // =============================================================
    //                           STRUCTS
    // =============================================================

    struct Property {
        string propertyId;        // Property identifier (e.g., "123")
        uint256 totalValue;       // Total property value in wei (e.g., $1M)
        uint256 tokenPrice;       // Price per token in wei (e.g., $1000)
        uint256 totalTokens;      // Total tokens for this property (1000)
        bool isActive;            // Whether tokens can be minted/traded
    }

    struct TokenListing {
        uint256 tokenId;          // Token being sold
        uint256 price;            // Asking price in wei
        address seller;           // Token owner
        bool isActive;            // Whether listing is active
    }

    // =============================================================
    //                        STATE VARIABLES
    // =============================================================

    // Counters
    Counters.Counter private _tokenIdCounter;
    
    // Property data
    Property public property;
    
    // Trading fee (1% = 100 basis points)
    uint256 public constant TRADING_FEE_BPS = 100;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Marketplace
    mapping(uint256 => TokenListing) public marketplace;
    mapping(uint256 => bool) public isTokenListed;
    
    // Week 2: Chainlink & DeFi Integration
    mapping(uint256 => bool) public stakedInAave;      // DeFi staking status
    mapping(uint256 => uint256) public stakingRewards; // Accumulated rewards
    bool public chainlinkVerified;                     // Functions verification status
    uint256 public lastPriceUpdate;                    // Data Feeds timestamp
    uint256 public automationCounter;                  // Automation execution count
    
    // Chainlink Data Feeds
    AggregatorV3Interface internal priceFeed;          // ETH/USD price feed
    uint256 public priceUpdateInterval;                // Price update frequency (seconds)
    
    // Chainlink Functions
    bytes32 public lastRequestId;                      // Last Functions request
    string public propertyApiUrl;                      // API endpoint for verification
    
    // Mock Aave integration
    uint256 public constant AAVE_APY_BPS = 500;        // 5% APY in basis points
    uint256 public totalStaked;                        // Total tokens staked
    mapping(address => uint256) public stakingTimestamp; // When user started staking

    // =============================================================
    //                           EVENTS
    // =============================================================

    event PropertyInitialized(string propertyId, uint256 totalValue, uint256 totalTokens);
    event TokenMinted(address indexed to, uint256 indexed tokenId, uint256 price);
    event TokenPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event TokenListed(uint256 indexed tokenId, uint256 price, address indexed seller);
    event TokenDelisted(uint256 indexed tokenId, address indexed seller);
    event TokenSold(uint256 indexed tokenId, uint256 price, address indexed seller, address indexed buyer);
    event TradingFeeCollected(uint256 amount);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    
    // Week 2: Chainlink & DeFi Events
    event ChainlinkVerificationRequested(bytes32 indexed requestId, string propertyId);
    event ChainlinkVerificationCompleted(bool verified, uint256 valuation);
    event PriceFeedUpdated(uint256 newPrice, uint256 timestamp);
    event AutomationPerformed(uint256 counter, uint256 timestamp);
    event TokenStakedInAave(uint256 indexed tokenId, address indexed owner);
    event TokenUnstakedFromAave(uint256 indexed tokenId, address indexed owner, uint256 rewards);
    event StakingRewardsClaimed(address indexed user, uint256 amount);

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor(address _priceFeed) ERC721("Lotwise Property Token", "LPT") {
        // Initialize with default $1M property
        _initializeProperty("123", 1000000 ether, 1000);
        
        // Start token IDs at 1
        _tokenIdCounter.increment();
        
        // Week 2: Initialize Chainlink components
        if (_priceFeed != address(0)) {
            priceFeed = AggregatorV3Interface(_priceFeed);
        }
        priceUpdateInterval = 3600; // 1 hour default
        propertyApiUrl = "http://localhost:5000/property/"; // Default API
        lastPriceUpdate = block.timestamp;
    }

    // =============================================================
    //                    CORE TOKENIZATION
    // =============================================================

    /**
     * @dev Initialize property data (owner-only for Week 1)
     * @param _propertyId Unique property identifier
     * @param _totalValue Total property value in wei
     * @param _totalTokens Total number of tokens to create
     */
    function _initializeProperty(
        string memory _propertyId,
        uint256 _totalValue,
        uint256 _totalTokens
    ) internal {
        require(_totalTokens > 0, "Total tokens must be > 0");
        require(_totalValue > 0, "Total value must be > 0");
        
        property = Property({
            propertyId: _propertyId,
            totalValue: _totalValue,
            tokenPrice: _totalValue / _totalTokens,
            totalTokens: _totalTokens,
            isActive: true
        });

        emit PropertyInitialized(_propertyId, _totalValue, _totalTokens);
    }

    /**
     * @dev Mint new tokens (owner-only for Week 1, Functions integration in Week 2)
     * @param to Address to mint tokens to
     * @param amount Number of tokens to mint
     */
    function mintTokens(address to, uint256 amount) external onlyOwner {
        require(property.isActive, "Property not active");
        require(amount > 0, "Amount must be > 0");
        require(
            _tokenIdCounter.current() + amount - 1 <= property.totalTokens,
            "Would exceed total token supply"
        );

        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _safeMint(to, tokenId);
            _tokenIdCounter.increment();
            
            emit TokenMinted(to, tokenId, property.tokenPrice);
        }
    }

    /**
     * @dev Buy tokens directly from the contract
     * @param amount Number of tokens to purchase
     */
    function buyTokens(uint256 amount) external payable nonReentrant {
        require(property.isActive, "Property not active");
        require(amount > 0, "Amount must be > 0");
        require(
            _tokenIdCounter.current() + amount - 1 <= property.totalTokens,
            "Not enough tokens available"
        );
        
        uint256 totalCost = property.tokenPrice * amount;
        require(msg.value >= totalCost, "Insufficient payment");

        // Mint tokens to buyer
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _safeMint(msg.sender, tokenId);
            _tokenIdCounter.increment();
            
            emit TokenPurchased(msg.sender, tokenId, property.tokenPrice);
        }

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    // =============================================================
    //                       MARKETPLACE
    // =============================================================

    /**
     * @dev List a token for sale
     * @param tokenId Token to list
     * @param price Asking price in wei
     */
    function listToken(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!isTokenListed[tokenId], "Token already listed");
        require(!stakedInAave[tokenId], "Token staked in Aave");
        require(price > 0, "Price must be > 0");

        marketplace[tokenId] = TokenListing({
            tokenId: tokenId,
            price: price,
            seller: msg.sender,
            isActive: true
        });
        
        isTokenListed[tokenId] = true;
        emit TokenListed(tokenId, price, msg.sender);
    }

    /**
     * @dev Remove token listing
     * @param tokenId Token to delist
     */
    function delistToken(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(isTokenListed[tokenId], "Token not listed");

        delete marketplace[tokenId];
        isTokenListed[tokenId] = false;
        
        emit TokenDelisted(tokenId, msg.sender);
    }

    /**
     * @dev Buy a listed token
     * @param tokenId Token to purchase
     */
    function buyListedToken(uint256 tokenId) external payable nonReentrant {
        TokenListing memory listing = marketplace[tokenId];
        require(listing.isActive, "Token not for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(ownerOf(tokenId) == listing.seller, "Seller no longer owns token");

        // Calculate fee and seller amount
        uint256 tradingFee = (listing.price * TRADING_FEE_BPS) / BASIS_POINTS;
        uint256 sellerAmount = listing.price - tradingFee;

        // Clear listing
        delete marketplace[tokenId];
        isTokenListed[tokenId] = false;

        // Transfer token
        _transfer(listing.seller, msg.sender, tokenId);

        // Transfer payment to seller (fee stays in contract)
        payable(listing.seller).transfer(sellerAmount);

        // Refund excess
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit TokenSold(tokenId, listing.price, listing.seller, msg.sender);
        emit TradingFeeCollected(tradingFee);
    }

    // =============================================================
    //                    WEEK 2+ PLACEHOLDERS
    // =============================================================

    /**
     * @dev Update token price (placeholder for Chainlink Data Feeds)
     * @param newTotalValue New total property value
     */
    function updatePropertyValue(uint256 newTotalValue) external onlyOwner {
        require(newTotalValue > 0, "Value must be > 0");
        
        uint256 oldPrice = property.tokenPrice;
        property.totalValue = newTotalValue;
        property.tokenPrice = newTotalValue / property.totalTokens;
        lastPriceUpdate = block.timestamp;
        
        emit PriceUpdated(oldPrice, property.tokenPrice);
    }

    // =============================================================
    //                        VIEW FUNCTIONS
    // =============================================================

    /**
     * @dev Get property information
     */
    function getProperty() external view returns (Property memory) {
        return property;
    }

    /**
     * @dev Get token listing information
     * @param tokenId Token ID to check
     */
    function getTokenListing(uint256 tokenId) external view returns (TokenListing memory) {
        return marketplace[tokenId];
    }

    /**
     * @dev Get all tokens owned by an address
     * @param owner Address to check
     */
    function getTokensOwnedBy(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }

    /**
     * @dev Get total tokens minted
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }

    /**
     * @dev Get remaining tokens available for minting
     */
    function remainingTokens() external view returns (uint256) {
        uint256 minted = _tokenIdCounter.current() - 1;
        return property.totalTokens > minted ? property.totalTokens - minted : 0;
    }

    // =============================================================
    //                     ADMIN FUNCTIONS
    // =============================================================

    /**
     * @dev Toggle property active status
     */
    function togglePropertyActive() external onlyOwner {
        property.isActive = !property.isActive;
    }

    /**
     * @dev Withdraw contract balance (trading fees)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Emergency: delist all tokens (if needed)
     */
    function emergencyDelistAll(uint256[] calldata tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (isTokenListed[tokenIds[i]]) {
                delete marketplace[tokenIds[i]];
                isTokenListed[tokenIds[i]] = false;
                emit TokenDelisted(tokenIds[i], address(this));
            }
        }
    }

    // =============================================================
    //                  CHAINLINK FUNCTIONS
    // =============================================================

    /**
     * @dev Request property verification via Chainlink Functions
     * @param propertyId Property ID to verify
     */
    function requestPropertyVerification(string memory propertyId) external onlyOwner {
        // Mock implementation for hackathon
        // In production, this would send a request to Chainlink Functions
        bytes32 requestId = keccak256(abi.encodePacked(propertyId, block.timestamp));
        lastRequestId = requestId;
        
        emit ChainlinkVerificationRequested(requestId, propertyId);
        
        // Simulate immediate response for demo
        _fulfillVerificationRequest(requestId, true, 1000000 ether);
    }

    /**
     * @dev Fulfill verification request (called by Chainlink Functions)
     * @param requestId Request identifier
     * @param verified Whether property is verified
     * @param valuation Current property valuation
     */
    function _fulfillVerificationRequest(
        bytes32 requestId,
        bool verified,
        uint256 valuation
    ) internal {
        require(requestId == lastRequestId, "Invalid request ID");
        
        chainlinkVerified = verified;
        
        if (verified && valuation != property.totalValue) {
            uint256 oldValue = property.totalValue;
            property.totalValue = valuation;
            property.tokenPrice = valuation / property.totalTokens;
            emit PriceUpdated(oldValue, valuation);
        }
        
        emit ChainlinkVerificationCompleted(verified, valuation);
    }

    // =============================================================
    //                  CHAINLINK DATA FEEDS
    // =============================================================

    /**
     * @dev Get latest ETH/USD price from Chainlink
     */
    function getLatestPrice() public view returns (uint256) {
        if (address(priceFeed) == address(0)) {
            return 2000 * 10**8; // Mock $2000 ETH price
        }
        
        (, int price,,,) = priceFeed.latestRoundData();
        return uint256(price);
    }

    /**
     * @dev Update property value based on price feeds
     */
    function updatePriceFromFeed() external onlyOwner {
        uint256 ethUsdPrice = getLatestPrice();
        
        // Simple price adjustment based on ETH price movement
        // In production, this would use more sophisticated real estate data
        uint256 adjustmentFactor = (ethUsdPrice > 2000 * 10**8) ? 105 : 95; // ±5%
        uint256 newValue = (property.totalValue * adjustmentFactor) / 100;
        
        uint256 oldValue = property.totalValue;
        property.totalValue = newValue;
        property.tokenPrice = newValue / property.totalTokens;
        lastPriceUpdate = block.timestamp;
        
        emit PriceUpdated(oldValue, newValue);
        emit PriceFeedUpdated(ethUsdPrice, block.timestamp);
    }

    // =============================================================
    //                CHAINLINK AUTOMATION
    // =============================================================

    /**
     * @dev Check if upkeep is needed (Chainlink Automation)
     */
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = (block.timestamp - lastPriceUpdate) > priceUpdateInterval;
        return (upkeepNeeded, "");
    }

    /**
     * @dev Perform upkeep (called by Chainlink Automation)
     */
    function performUpkeep(bytes calldata) external override {
        require((block.timestamp - lastPriceUpdate) > priceUpdateInterval, "Upkeep not needed");
        
        automationCounter++;
        
        // Auto-update price from feeds
        if (address(priceFeed) != address(0)) {
            uint256 ethUsdPrice = getLatestPrice();
            uint256 adjustmentFactor = (ethUsdPrice > 2000 * 10**8) ? 102 : 98; // ±2% for automation
            uint256 newValue = (property.totalValue * adjustmentFactor) / 100;
            
            uint256 oldValue = property.totalValue;
            property.totalValue = newValue;
            property.tokenPrice = newValue / property.totalTokens;
            lastPriceUpdate = block.timestamp;
            
            emit PriceUpdated(oldValue, newValue);
        }
        
        emit AutomationPerformed(automationCounter, block.timestamp);
    }

    /**
     * @dev Set price update interval (admin)
     */
    function setPriceUpdateInterval(uint256 _interval) external onlyOwner {
        priceUpdateInterval = _interval;
    }

    // =============================================================
    //                   MOCK AAVE INTEGRATION
    // =============================================================

    /**
     * @dev Stake token in Aave for yield (mock implementation)
     * @param tokenId Token to stake
     */
    function stakeInAave(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!stakedInAave[tokenId], "Token already staked");
        
        stakedInAave[tokenId] = true;
        totalStaked++;
        
        if (stakingTimestamp[msg.sender] == 0) {
            stakingTimestamp[msg.sender] = block.timestamp;
        }
        
        emit TokenStakedInAave(tokenId, msg.sender);
    }

    /**
     * @dev Unstake token from Aave and claim rewards
     * @param tokenId Token to unstake
     */
    function unstakeFromAave(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(stakedInAave[tokenId], "Token not staked");
        
        uint256 rewards = calculateStakingRewards(msg.sender);
        
        stakedInAave[tokenId] = false;
        totalStaked--;
        stakingRewards[tokenId] += rewards;
        
        emit TokenUnstakedFromAave(tokenId, msg.sender, rewards);
    }

    /**
     * @dev Calculate staking rewards for user
     * @param user User address
     */
    function calculateStakingRewards(address user) public view returns (uint256) {
        if (stakingTimestamp[user] == 0) return 0;
        
        uint256 timeStaked = block.timestamp - stakingTimestamp[user];
        uint256 userTokens = balanceOf(user);
        
        // Calculate APY rewards (5% annually)
        uint256 annualReward = (userTokens * property.tokenPrice * AAVE_APY_BPS) / BASIS_POINTS;
        uint256 rewards = (annualReward * timeStaked) / 365 days;
        
        return rewards;
    }

    /**
     * @dev Claim accumulated staking rewards
     */
    function claimStakingRewards() external {
        uint256 rewards = calculateStakingRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        stakingTimestamp[msg.sender] = block.timestamp;
        payable(msg.sender).transfer(rewards);
        
        emit StakingRewardsClaimed(msg.sender, rewards);
    }

    /**
     * @dev Get staking info for user
     */
    function getStakingInfo(address user) external view returns (
        uint256 tokensStaked,
        uint256 rewardsAvailable,
        uint256 timeStaked
    ) {
        uint256 tokens = balanceOf(user);
        uint256 stakedCount = 0;
        
        for (uint256 i = 0; i < tokens; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(user, i);
            if (stakedInAave[tokenId]) {
                stakedCount++;
            }
        }
        
        return (
            stakedCount,
            calculateStakingRewards(user),
            stakingTimestamp[user] > 0 ? block.timestamp - stakingTimestamp[user] : 0
        );
    }

    // =============================================================
    //                    CHAINLINK CCIP (Mock)
    // =============================================================

    /**
     * @dev Mock CCIP cross-chain transfer (placeholder for full implementation)
     * @param tokenId Token to transfer cross-chain
     * @param destinationChain Target chain selector
     * @param recipient Recipient address on destination chain
     */
    function crossChainTransfer(
        uint256 tokenId,
        uint64 destinationChain,
        address recipient
    ) external payable {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!stakedInAave[tokenId], "Cannot transfer staked token");
        require(!isTokenListed[tokenId], "Cannot transfer listed token");
        
        // Mock implementation - in production this would use Chainlink CCIP
        // For hackathon, we'll just emit an event
        emit TokenSold(tokenId, 0, msg.sender, recipient); // Reuse event for demo
        
        // In production: burn token here and mint on destination chain
        _transfer(msg.sender, address(this), tokenId); // Temporarily hold token
    }

    // =============================================================
    //                       ADMIN FUNCTIONS
    // =============================================================

    /**
     * @dev Set Chainlink price feed address
     */
    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    /**
     * @dev Set property API URL for Chainlink Functions
     */
    function setPropertyApiUrl(string memory _url) external onlyOwner {
        propertyApiUrl = _url;
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
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
