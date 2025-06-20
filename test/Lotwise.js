const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lotwise Contract", function () {
  let lotwise;
  let owner;
  let buyer1;
  let buyer2;
  let trader;

  // Constants
  const PROPERTY_VALUE = ethers.parseEther("1000000"); // $1M equivalent
  const TOKEN_PRICE = ethers.parseEther("1000");       // $1K per token
  const TOTAL_TOKENS = 1000;  beforeEach(async function () {
    // Get signers
    [owner, buyer1, buyer2, trader] = await ethers.getSigners();

    // Deploy contract with zero address for price feed (local testing)
    const Lotwise = await ethers.getContractFactory("Lotwise");
    lotwise = await Lotwise.deploy(ethers.ZeroAddress);

    console.log(`📜 Contract deployed to: ${lotwise.target}`);
    console.log(`👤 Owner: ${owner.address}`);
  });

  describe("🏠 Property Initialization", function () {
    it("should initialize with correct property data", async function () {
      const property = await lotwise.getProperty();
      
      expect(property.propertyId).to.equal("123");
      expect(property.totalValue).to.equal(PROPERTY_VALUE);
      expect(property.tokenPrice).to.equal(TOKEN_PRICE);
      expect(property.totalTokens).to.equal(TOTAL_TOKENS);
      expect(property.isActive).to.be.true;
    });

    it("should have correct contract metadata", async function () {
      expect(await lotwise.name()).to.equal("Lotwise Property Token");
      expect(await lotwise.symbol()).to.equal("LPT");
      expect(await lotwise.owner()).to.equal(owner.address);
    });
  });

  describe("🪙 Token Minting", function () {
    it("should allow owner to mint tokens", async function () {
      const mintAmount = 10;
      
      await expect(lotwise.mintTokens(buyer1.address, mintAmount))
        .to.emit(lotwise, "TokenMinted");

      expect(await lotwise.balanceOf(buyer1.address)).to.equal(mintAmount);
      expect(await lotwise.totalMinted()).to.equal(mintAmount);
    });

    it("should not allow non-owner to mint tokens", async function () {
      await expect(
        lotwise.connect(buyer1).mintTokens(buyer1.address, 5)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should not mint more than total supply", async function () {
      await expect(
        lotwise.mintTokens(buyer1.address, TOTAL_TOKENS + 1)
      ).to.be.revertedWith("Would exceed total token supply");
    });
  });

  describe("💰 Token Purchasing", function () {
    it("should allow buying tokens with correct payment", async function () {
      const buyAmount = 5;
      const totalCost = TOKEN_PRICE * BigInt(buyAmount);

      await expect(
        lotwise.connect(buyer1).buyTokens(buyAmount, { value: totalCost })
      ).to.emit(lotwise, "TokenPurchased");

      expect(await lotwise.balanceOf(buyer1.address)).to.equal(buyAmount);
      expect(await lotwise.totalMinted()).to.equal(buyAmount);
    });

    it("should refund excess payment", async function () {
      const buyAmount = 2;
      const totalCost = TOKEN_PRICE * BigInt(buyAmount);
      const excessPayment = ethers.parseEther("100"); // Extra 100 ETH
      const totalPayment = totalCost + excessPayment;

      const initialBalance = await ethers.provider.getBalance(buyer1.address);
      
      const tx = await lotwise.connect(buyer1).buyTokens(buyAmount, { 
        value: totalPayment 
      });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(buyer1.address);
      const expectedBalance = initialBalance - totalCost - gasUsed;

      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
    });

    it("should reject insufficient payment", async function () {
      const buyAmount = 1; // Reduced from 3 to 1
      const insufficientPayment = TOKEN_PRICE * BigInt(buyAmount) - BigInt(1);

      await expect(
        lotwise.connect(buyer1).buyTokens(buyAmount, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("should reject zero amount purchase", async function () {
      await expect(
        lotwise.connect(buyer1).buyTokens(0, { value: TOKEN_PRICE })
      ).to.be.revertedWith("Amount must be > 0");
    });
  });

  describe("🏪 Marketplace Trading", function () {
    beforeEach(async function () {
      // Mint some tokens for trading
      await lotwise.mintTokens(trader.address, 10);
    });

    it("should allow listing tokens for sale", async function () {
      const tokenId = 1;
      const listingPrice = ethers.parseEther("1200"); // $1200

      await expect(
        lotwise.connect(trader).listToken(tokenId, listingPrice)
      ).to.emit(lotwise, "TokenListed");

      const listing = await lotwise.getTokenListing(tokenId);
      expect(listing.tokenId).to.equal(tokenId);
      expect(listing.price).to.equal(listingPrice);
      expect(listing.seller).to.equal(trader.address);
      expect(listing.isActive).to.be.true;
    });

    it("should not allow non-owner to list token", async function () {
      const tokenId = 1;
      const listingPrice = ethers.parseEther("1200");

      await expect(
        lotwise.connect(buyer1).listToken(tokenId, listingPrice)
      ).to.be.revertedWith("Not token owner");
    });

    it("should allow buying listed tokens", async function () {
      const tokenId = 1;
      const listingPrice = ethers.parseEther("1200");

      // List token
      await lotwise.connect(trader).listToken(tokenId, listingPrice);

      // Buy token
      await expect(
        lotwise.connect(buyer1).buyListedToken(tokenId, { value: listingPrice })
      ).to.emit(lotwise, "TokenSold");

      // Check ownership transfer
      expect(await lotwise.ownerOf(tokenId)).to.equal(buyer1.address);
      
      // Check listing is cleared
      const listing = await lotwise.getTokenListing(tokenId);
      expect(listing.isActive).to.be.false;
    });

    it("should charge 1% trading fee", async function () {
      const tokenId = 1;
      const listingPrice = ethers.parseEther("1000"); // $1000
      const expectedFee = listingPrice / BigInt(100); // 1%

      // List token
      await lotwise.connect(trader).listToken(tokenId, listingPrice);

      // Record initial contract balance
      const contractInitialBalance = await ethers.provider.getBalance(lotwise.target);

      // Buy token
      await lotwise.connect(buyer1).buyListedToken(tokenId, { value: listingPrice });

      // Check fee was collected in contract
      const contractFinalBalance = await ethers.provider.getBalance(lotwise.target);
      expect(contractFinalBalance - contractInitialBalance).to.equal(expectedFee);
    });

    it("should allow delisting tokens", async function () {
      const tokenId = 1;
      const listingPrice = ethers.parseEther("1200");

      // List token
      await lotwise.connect(trader).listToken(tokenId, listingPrice);

      // Delist token
      await expect(
        lotwise.connect(trader).delistToken(tokenId)
      ).to.emit(lotwise, "TokenDelisted");

      // Check listing is cleared
      const listing = await lotwise.getTokenListing(tokenId);
      expect(listing.isActive).to.be.false;
    });
  });

  describe("📊 View Functions", function () {
    beforeEach(async function () {
      // Setup test data
      await lotwise.mintTokens(buyer1.address, 5);
      await lotwise.connect(buyer2).buyTokens(1, { 
        value: TOKEN_PRICE * BigInt(1) 
      });
    });

    it("should return correct token ownership", async function () {
      const buyer1Tokens = await lotwise.getTokensOwnedBy(buyer1.address);
      const buyer2Tokens = await lotwise.getTokensOwnedBy(buyer2.address);

      expect(buyer1Tokens.length).to.equal(5);
      expect(buyer2Tokens.length).to.equal(1);
    });

    it("should return correct minting statistics", async function () {
      expect(await lotwise.totalMinted()).to.equal(6);
      expect(await lotwise.remainingTokens()).to.equal(TOTAL_TOKENS - 6);
    });

    it("should return correct property data", async function () {
      const property = await lotwise.getProperty();
      
      expect(property.propertyId).to.equal("123");
      expect(property.totalTokens).to.equal(TOTAL_TOKENS);
      expect(property.isActive).to.be.true;
    });
  });

  describe("🛡️ Admin Functions", function () {
    it("should allow owner to update property value", async function () {
      const newValue = ethers.parseEther("1200000"); // $1.2M
      const expectedNewPrice = newValue / BigInt(TOTAL_TOKENS);

      await expect(
        lotwise.updatePropertyValue(newValue)
      ).to.emit(lotwise, "PriceUpdated");

      const property = await lotwise.getProperty();
      expect(property.totalValue).to.equal(newValue);
      expect(property.tokenPrice).to.equal(expectedNewPrice);
    });

    it("should allow owner to toggle property active status", async function () {
      await lotwise.togglePropertyActive();
      
      const property = await lotwise.getProperty();
      expect(property.isActive).to.be.false;

      // Should not allow buying when inactive (use buyer2 who has more funds)
      await expect(
        lotwise.connect(buyer2).buyTokens(1, { value: TOKEN_PRICE })
      ).to.be.revertedWith("Property not active");
    });

    it("should allow owner to withdraw fees", async function () {
      // Generate some trading fees
      await lotwise.mintTokens(trader.address, 5);
      await lotwise.connect(trader).listToken(1, TOKEN_PRICE);
      await lotwise.connect(buyer2).buyListedToken(1, { value: TOKEN_PRICE });

      const contractBalance = await ethers.provider.getBalance(lotwise.target);
      expect(contractBalance).to.be.gt(0);

      const ownerInitialBalance = await ethers.provider.getBalance(owner.address);
      const tx = await lotwise.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const ownerFinalBalance = await ethers.provider.getBalance(owner.address);
      const expectedBalance = ownerInitialBalance + contractBalance - gasUsed;

      expect(ownerFinalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.01"));
    });
  });

  describe("� Week 2: Chainlink Functions", function () {
    it("should allow owner to request property verification", async function () {
      await expect(
        lotwise.requestPropertyVerification("123")
      ).to.emit(lotwise, "ChainlinkVerificationRequested");

      expect(await lotwise.chainlinkVerified()).to.be.true;
    });

    it("should not allow non-owner to request verification", async function () {
      await expect(
        lotwise.connect(buyer1).requestPropertyVerification("123")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("📊 Week 2: Chainlink Data Feeds", function () {
    it("should return mock ETH price when no price feed", async function () {
      const price = await lotwise.getLatestPrice();
      expect(price).to.equal(2000 * 10**8); // Mock $2000 ETH price
    });

    it("should allow owner to update price from feed", async function () {
      await expect(
        lotwise.updatePriceFromFeed()
      ).to.emit(lotwise, "PriceUpdated")
      .and.to.emit(lotwise, "PriceFeedUpdated");
    });

    it("should update lastPriceUpdate timestamp", async function () {
      const before = await lotwise.lastPriceUpdate();
      await lotwise.updatePriceFromFeed();
      const after = await lotwise.lastPriceUpdate();
      
      expect(after).to.be.gt(before);
    });
  });

  describe("🤖 Week 2: Chainlink Automation", function () {
    it("should check upkeep correctly", async function () {
      // Initially, upkeep should not be needed (just deployed)
      const [upkeepNeeded] = await lotwise.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.false;
    });

    it("should perform upkeep when needed", async function () {
      // Fast forward time to make upkeep needed (more than 1 hour)
      await ethers.provider.send("evm_increaseTime", [3700]); // 1 hour + extra
      await ethers.provider.send("evm_mine");

      const [upkeepNeeded] = await lotwise.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;

      await expect(
        lotwise.performUpkeep("0x")
      ).to.emit(lotwise, "AutomationPerformed");

      expect(await lotwise.automationCounter()).to.equal(1);
    });

    it("should allow owner to set price update interval", async function () {
      await lotwise.setPriceUpdateInterval(7200); // 2 hours
      expect(await lotwise.priceUpdateInterval()).to.equal(7200);
    });
  });

  describe("🏦 Week 2: Enhanced Aave Integration", function () {
    beforeEach(async function () {
      await lotwise.mintTokens(buyer1.address, 3);
    });

    it("should stake tokens and track staking info", async function () {
      const tokenId = 1;

      await expect(
        lotwise.connect(buyer1).stakeInAave(tokenId)
      ).to.emit(lotwise, "TokenStakedInAave");

      expect(await lotwise.stakedInAave(tokenId)).to.be.true;
      expect(await lotwise.totalStaked()).to.equal(1);
    });

    it("should calculate staking rewards correctly", async function () {
      const tokenId = 1;
      await lotwise.connect(buyer1).stakeInAave(tokenId);
      
      // Fast forward time to accumulate rewards
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");

      const rewards = await lotwise.calculateStakingRewards(buyer1.address);
      expect(rewards).to.be.gt(0);
    });

    it("should allow unstaking with rewards", async function () {
      const tokenId = 1;
      await lotwise.connect(buyer1).stakeInAave(tokenId);
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");

      await expect(
        lotwise.connect(buyer1).unstakeFromAave(tokenId)
      ).to.emit(lotwise, "TokenUnstakedFromAave");

      expect(await lotwise.stakedInAave(tokenId)).to.be.false;
    });

    it("should return correct staking info", async function () {
      const tokenId = 1;
      await lotwise.connect(buyer1).stakeInAave(tokenId);
      
      // Fast forward time to accumulate some rewards
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");
      
      const [tokensStaked, rewardsAvailable, timeStaked] = await lotwise.getStakingInfo(buyer1.address);
      
      expect(tokensStaked).to.equal(1);
      expect(rewardsAvailable).to.be.gt(0);
      expect(timeStaked).to.be.gt(0);
    });

    it("should not allow listing staked tokens", async function () {
      const tokenId = 1;
      
      await lotwise.connect(buyer1).stakeInAave(tokenId);

      await expect(
        lotwise.connect(buyer1).listToken(tokenId, TOKEN_PRICE)
      ).to.be.revertedWith("Token staked in Aave");
    });
  });

  describe("🌐 Week 2: CCIP Cross-Chain (Mock)", function () {
    beforeEach(async function () {
      await lotwise.mintTokens(buyer1.address, 1);
    });

    it("should allow cross-chain transfer of tokens", async function () {
      const tokenId = 1;
      const destinationChain = 1; // Mock chain ID
      const recipient = buyer2.address;

      await expect(
        lotwise.connect(buyer1).crossChainTransfer(tokenId, destinationChain, recipient)
      ).to.emit(lotwise, "TokenSold"); // Reusing event for demo

      // In mock implementation, token gets transferred to contract
      expect(await lotwise.ownerOf(tokenId)).to.equal(lotwise.target);
    });

    it("should not allow cross-chain transfer of staked tokens", async function () {
      const tokenId = 1;
      await lotwise.connect(buyer1).stakeInAave(tokenId);

      await expect(
        lotwise.connect(buyer1).crossChainTransfer(tokenId, 1, buyer2.address)
      ).to.be.revertedWith("Cannot transfer staked token");
    });

    it("should not allow cross-chain transfer of listed tokens", async function () {
      const tokenId = 1;
      await lotwise.connect(buyer1).listToken(tokenId, TOKEN_PRICE);

      await expect(
        lotwise.connect(buyer1).crossChainTransfer(tokenId, 1, buyer2.address)
      ).to.be.revertedWith("Cannot transfer listed token");
    });
  });

  describe("⚙️ Week 2: Admin Functions", function () {
    it("should allow owner to set price feed address", async function () {
      const mockPriceFeed = buyer1.address; // Mock address
      await lotwise.setPriceFeed(mockPriceFeed);
      // Note: We can't easily test the internal priceFeed variable
    });

    it("should allow owner to set property API URL", async function () {
      const newUrl = "https://api.example.com/property/";
      await lotwise.setPropertyApiUrl(newUrl);
      expect(await lotwise.propertyApiUrl()).to.equal(newUrl);
    });

    it("should not allow non-owner to set price feed", async function () {
      await expect(
        lotwise.connect(buyer1).setPriceFeed(buyer1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
