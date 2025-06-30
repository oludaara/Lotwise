const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lotwise VRF and Functions Integration", function () {
    let lotwise;
    let owner, user1, user2, operator;
    let mockEthPriceFeed, mockMaticPriceFeed, mockVRFCoordinator;
    let mockCCIPRouter;

    // Test constants
    const PROPERTY_VALUE = ethers.parseEther("1000000"); // $1M
    const TOKEN_PRICE = ethers.parseEther("1000"); // $1K per token
    const ETH_PRICE = 200000000000; // $2000 in 8 decimals

    beforeEach(async function () {
        [owner, user1, user2, operator] = await ethers.getSigners();

        // Deploy mock contracts
        const MockPriceFeed = await ethers.getContractFactory("MockV3Aggregator");
        mockEthPriceFeed = await MockPriceFeed.deploy(8, ETH_PRICE);
        mockMaticPriceFeed = await MockPriceFeed.deploy(8, 100000000); // $1 MATIC

        // Mock VRF Coordinator
        const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinatorV2");
        mockVRFCoordinator = await MockVRFCoordinator.deploy();

        // Mock CCIP Router
        const MockCCIPRouter = await ethers.getContractFactory("MockCCIPRouter");
        mockCCIPRouter = await MockCCIPRouter.deploy();

        // Deploy Lotwise with VRF parameters
        const Lotwise = await ethers.getContractFactory("Lotwise");
        lotwise = await Lotwise.deploy(
            await mockCCIPRouter.getAddress(),
            await mockEthPriceFeed.getAddress(),
            await mockMaticPriceFeed.getAddress(),
            11155111, // Sepolia
            await mockVRFCoordinator.getAddress(),
            "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // Mock key hash
            1 // Mock subscription ID
        );

        await lotwise.waitForDeployment();

        // Add operator
        await lotwise.addOperator(operator.address);
    });

    describe("VRF Integration", function () {
        beforeEach(async function () {
            // Create property and mint tokens
            await lotwise.createProperty("PROP-001", PROPERTY_VALUE, "ipfs://test");

            const quantity = 10;
            const totalCostETH = (TOKEN_PRICE * BigInt(quantity)) * ethers.parseEther("1") / (BigInt(ETH_PRICE) * BigInt(1e10));

            await lotwise.connect(user1).mintPropertyTokens(1, user1.address, quantity, {
                value: totalCostETH
            });
        });

        it("Should request VRF for yield bonus distribution", async function () {
            await expect(lotwise.connect(operator).requestYieldBonusVRF(1))
                .to.emit(lotwise, "VRFRequestSubmitted")
                .withArgs(1, 1, 0); // requestId, propertyId, YIELD_BONUS

            const vrfRequest = await lotwise.getVRFRequest(1);
            expect(vrfRequest.propertyId).to.equal(1);
            expect(vrfRequest.requestType).to.equal(0); // YIELD_BONUS
            expect(vrfRequest.fulfilled).to.be.false;
        });

        it("Should reject VRF request from unauthorized users", async function () {
            await expect(lotwise.connect(user1).requestYieldBonusVRF(1))
                .to.be.revertedWith("Not authorized");
        });

        it("Should reject VRF request for property with no tokens", async function () {
            await expect(lotwise.connect(operator).requestYieldBonusVRF(999))
                .to.be.revertedWith("Property does not exist");
        });

        it("Should fulfill VRF request and assign yield bonuses", async function () {
            // Request VRF
            await lotwise.connect(operator).requestYieldBonusVRF(1);

            // Mock VRF fulfillment
            const randomWords = [ethers.parseUnits("123456789", 0)];
            await mockVRFCoordinator.fulfillRandomWords(1, await lotwise.getAddress(), randomWords);

            // Check that bonuses were assigned
            const activeBonuses = await lotwise.getActiveYieldBonuses(1);
            expect(activeBonuses.length).to.be.greaterThan(0);

            // Check individual bonus
            if (activeBonuses.length > 0) {
                const bonus = await lotwise.getYieldBonus(activeBonuses[0]);
                expect(bonus.isActive).to.be.true;
                expect(bonus.bonusPercentage).to.be.greaterThan(0);
                expect(bonus.expiryTimestamp).to.be.greaterThan(0);
            }
        });

        it("Should apply yield bonuses during distribution", async function () {
            // Request VRF and fulfill
            await lotwise.connect(operator).requestYieldBonusVRF(1);
            const randomWords = [ethers.parseUnits("123456789", 0)];
            await mockVRFCoordinator.fulfillRandomWords(1, await lotwise.getAddress(), randomWords);

            // Distribute yield
            await lotwise.connect(operator).distributeYield(1);

            // Check that yield was distributed with bonuses
            const claimableYield = await lotwise.getClaimableYield(1, user1.address);
            expect(claimableYield).to.be.greaterThan(0);
        });
    });

    describe("Chainlink Functions Integration", function () {
        beforeEach(async function () {
            await lotwise.createProperty("PROP-001", PROPERTY_VALUE, "ipfs://test");
        });

        it("Should request property verification", async function () {
            await expect(lotwise.connect(operator).requestPropertyVerification(1))
                .to.emit(lotwise, "PropertyVerificationRequested")
                .withArgs(1, "PROP-001", await time());

            const status = await lotwise.getPropertyVerificationStatus(1);
            expect(status.verificationRequested).to.be.true;
        });

        it("Should reject verification request from unauthorized users", async function () {
            await expect(lotwise.connect(user1).requestPropertyVerification(1))
                .to.be.revertedWith("Not authorized");
        });

        it("Should reject duplicate verification requests", async function () {
            await lotwise.connect(operator).requestPropertyVerification(1);

            await expect(lotwise.connect(operator).requestPropertyVerification(1))
                .to.be.revertedWith("Verification already requested");
        });

        it("Should complete property verification", async function () {
            // Request verification
            await lotwise.connect(operator).requestPropertyVerification(1);

            // Complete verification
            const verificationData = '{"verified": true, "source": "chainlink-functions"}';
            await expect(lotwise.connect(operator).completePropertyVerification(1, true, verificationData))
                .to.emit(lotwise, "PropertyVerificationCompleted")
                .withArgs(1, true, verificationData, await time());

            const status = await lotwise.getPropertyVerificationStatus(1);
            expect(status.isVerified).to.be.true;
            expect(status.verificationRequested).to.be.false;
            expect(status.verificationData).to.equal(verificationData);
        });

        it("Should reject completion without request", async function () {
            await expect(lotwise.connect(operator).completePropertyVerification(1, true, "data"))
                .to.be.revertedWith("Verification not requested");
        });
    });

    describe("Admin Functions", function () {
        it("Should update VRF settings", async function () {
            const newKeyHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
            const newSubscriptionId = 2;
            const newCallbackGasLimit = 150000;
            const newRequestConfirmations = 5;

            await lotwise.updateVRFSettings(
                newKeyHash,
                newSubscriptionId,
                newCallbackGasLimit,
                newRequestConfirmations
            );

            expect(await lotwise.vrfKeyHash()).to.equal(newKeyHash);
            expect(await lotwise.vrfSubscriptionId()).to.equal(newSubscriptionId);
        });

        it("Should update VRF coordinator", async function () {
            const newCoordinator = await ethers.getSigner(5);
            await lotwise.updateVRFCoordinator(newCoordinator.address);
            expect(await lotwise.vrfCoordinator()).to.equal(newCoordinator.address);
        });

        it("Should clear expired yield bonuses", async function () {
            // Create property and mint tokens
            await lotwise.createProperty("PROP-001", PROPERTY_VALUE, "ipfs://test");

            const quantity = 5;
            const totalCostETH = (TOKEN_PRICE * BigInt(quantity)) * ethers.parseEther("1") / (BigInt(ETH_PRICE) * BigInt(1e10));

            await lotwise.connect(user1).mintPropertyTokens(1, user1.address, quantity, {
                value: totalCostETH
            });

            // Request VRF and fulfill to create bonuses
            await lotwise.connect(operator).requestYieldBonusVRF(1);
            const randomWords = [ethers.parseUnits("123456789", 0)];
            await mockVRFCoordinator.fulfillRandomWords(1, await lotwise.getAddress(), randomWords);

            // Fast forward time to expire bonuses
            await ethers.provider.send("evm_increaseTime", [604800 + 1]); // 7 days + 1 second
            await ethers.provider.send("evm_mine");

            // Clear expired bonuses
            const activeBonuses = await lotwise.getActiveYieldBonuses(1);
            if (activeBonuses.length > 0) {
                await lotwise.connect(operator).clearExpiredYieldBonuses(activeBonuses);

                // Check that bonuses are cleared
                const clearedBonuses = await lotwise.getActiveYieldBonuses(1);
                expect(clearedBonuses.length).to.equal(0);
            }
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await lotwise.createProperty("PROP-001", PROPERTY_VALUE, "ipfs://test");
        });

        it("Should check property verification pending status", async function () {
            expect(await lotwise.isPropertyVerificationPending(1)).to.be.false;

            await lotwise.connect(operator).requestPropertyVerification(1);
            expect(await lotwise.isPropertyVerificationPending(1)).to.be.true;
        });

        it("Should get property verification status", async function () {
            const status = await lotwise.getPropertyVerificationStatus(1);
            expect(status.isVerified).to.be.false;
            expect(status.verificationRequested).to.be.false;
            expect(status.verificationTimestamp).to.equal(0);
            expect(status.verificationData).to.equal("");
        });
    });
});

// Helper function to get current timestamp
async function time() {
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    return block.timestamp;
} 