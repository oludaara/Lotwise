const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Lotwise CCIP Integration", function () {
    let lotwise;
    let owner;
    let user1;
    let user2;
    let mockRouter;
    let mockEthUsd;
    let mockMaticUsd;

    const CHAIN_ID_SEPOLIA = 11155111;
    const CHAIN_ID_MUMBAI = 80001;
    const CHAIN_ID_FUJI = 43113;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy mock CCIP router
        const MockRouter = await ethers.getContractFactory("MockCCIPRouter");
        mockRouter = await MockRouter.deploy();
        await mockRouter.deployed();

        // Deploy mock price feeds
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        mockEthUsd = await MockV3Aggregator.deploy(8, 200000000000); // $2000
        mockMaticUsd = await MockV3Aggregator.deploy(8, 100000000); // $1

        // Deploy LotwiseCCIP contract
        const LotwiseCCIP = await ethers.getContractFactory("LotwiseCCIP");
        lotwise = await LotwiseCCIP.deploy(
            mockRouter.address,
            CHAIN_ID_SEPOLIA
        );
        await lotwise.deployed();

        // Setup mock router
        await mockRouter.setSupportedChain(CHAIN_ID_MUMBAI, true);
        await mockRouter.setSupportedChain(CHAIN_ID_FUJI, true);
        await mockRouter.setFee(CHAIN_ID_MUMBAI, ethers.utils.parseEther("0.001"));
        await mockRouter.setFee(CHAIN_ID_FUJI, ethers.utils.parseEther("0.001"));
    });

    describe("Contract Deployment", function () {
        it("Should deploy with correct parameters", async function () {
            expect(await lotwise.router()).to.equal(mockRouter.address);
            expect(await lotwise.currentChain()).to.equal(CHAIN_ID_SEPOLIA);
        });

        it("Should initialize supported chains", async function () {
            expect(await lotwise.supportedChains(1)).to.be.true; // Ethereum
            expect(await lotwise.supportedChains(137)).to.be.true; // Polygon
            expect(await lotwise.supportedChains(43114)).to.be.true; // Avalanche
            expect(await lotwise.supportedChains(11155111)).to.be.true; // Sepolia
            expect(await lotwise.supportedChains(80001)).to.be.true; // Mumbai
            expect(await lotwise.supportedChains(43113)).to.be.true; // Fuji
        });
    });

    describe("Property Management", function () {
        it("Should create property successfully", async function () {
            const propertyId = "PROP001";
            const totalValue = ethers.utils.parseEther("1000000"); // $1M
            const tokenPrice = ethers.utils.parseEther("1000"); // $1000

            await lotwise.createProperty(
                propertyId,
                totalValue,
                tokenPrice,
                "ipfs://QmTestMetadata"
            );

            const property = await lotwise.getProperty(1);
            expect(property.propertyId).to.equal(propertyId);
            expect(property.totalValue).to.equal(totalValue);
            expect(property.tokenPrice).to.equal(tokenPrice);
            expect(property.isActive).to.be.true;
        });

        it("Should mint property tokens", async function () {
            // Create property first
            await lotwise.createProperty(
                "PROP001",
                ethers.utils.parseEther("1000000"),
                ethers.utils.parseEther("1000"),
                "ipfs://QmTestMetadata"
            );

            // Mint tokens
            await lotwise.mintPropertyTokens(1, user1.address, 5);

            // Check token ownership
            expect(await lotwise.ownerOf(1)).to.equal(user1.address);
            expect(await lotwise.ownerOf(2)).to.equal(user1.address);
            expect(await lotwise.ownerOf(3)).to.equal(user1.address);
            expect(await lotwise.ownerOf(4)).to.equal(user1.address);
            expect(await lotwise.ownerOf(5)).to.equal(user1.address);

            // Check property token count
            const property = await lotwise.getProperty(1);
            expect(property.mintedTokens).to.equal(5);
        });
    });

    describe("Marketplace Functions", function () {
        beforeEach(async function () {
            // Create property and mint tokens
            await lotwise.createProperty(
                "PROP001",
                ethers.utils.parseEther("1000000"),
                ethers.utils.parseEther("1000"),
                "ipfs://QmTestMetadata"
            );
            await lotwise.mintPropertyTokens(1, user1.address, 3);
        });

        it("Should list token for sale", async function () {
            const tokenId = 1;
            const price = ethers.utils.parseEther("1200"); // $1200

            await lotwise.connect(user1).listToken(tokenId, price);

            const listing = await lotwise.marketplace(tokenId);
            expect(listing.tokenId).to.equal(tokenId);
            expect(listing.price).to.equal(price);
            expect(listing.seller).to.equal(user1.address);
            expect(listing.isActive).to.be.true;
            expect(listing.sourceChain).to.equal(CHAIN_ID_SEPOLIA);
        });

        it("Should buy listed token", async function () {
            const tokenId = 1;
            const price = ethers.utils.parseEther("1200");

            // List token
            await lotwise.connect(user1).listToken(tokenId, price);

            // Buy token
            const priceETH = price.div(2000); // Convert USD to ETH (assuming $2000/ETH)
            await lotwise.connect(user2).buyToken(tokenId, { value: priceETH });

            // Check ownership transfer
            expect(await lotwise.ownerOf(tokenId)).to.equal(user2.address);

            // Check listing is removed
            const listing = await lotwise.marketplace(tokenId);
            expect(listing.isActive).to.be.false;
        });

        it("Should not allow buying own token", async function () {
            const tokenId = 1;
            const price = ethers.utils.parseEther("1200");

            await lotwise.connect(user1).listToken(tokenId, price);

            const priceETH = price.div(2000);
            await expect(
                lotwise.connect(user1).buyToken(tokenId, { value: priceETH })
            ).to.be.revertedWith("Cannot buy own token");
        });
    });

    describe("Cross-Chain Transfers", function () {
        beforeEach(async function () {
            // Create property and mint tokens
            await lotwise.createProperty(
                "PROP001",
                ethers.utils.parseEther("1000000"),
                ethers.utils.parseEther("1000"),
                "ipfs://QmTestMetadata"
            );
            await lotwise.mintPropertyTokens(1, user1.address, 3);
        });

        it("Should estimate transfer fee", async function () {
            const tokenId = 1;
            const destinationChain = CHAIN_ID_MUMBAI;
            const recipient = user2.address;

            const fee = await lotwise.estimateTransferFee(
                tokenId,
                destinationChain,
                recipient
            );

            expect(fee).to.be.gt(0);
        });

        it("Should initiate cross-chain transfer", async function () {
            const tokenId = 1;
            const destinationChain = CHAIN_ID_MUMBAI;
            const recipient = user2.address;
            const fee = ethers.utils.parseEther("0.001");

            // Mock router to return a message ID
            const messageId = ethers.utils.randomBytes(32);
            await mockRouter.setNextMessageId(messageId);

            await lotwise.connect(user1).transferCrossChain(
                tokenId,
                destinationChain,
                recipient,
                { value: fee }
            );

            // Check token is burned on source chain
            await expect(lotwise.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");

            // Check transfer record
            const transferId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["uint256", "address", "address", "uint64", "uint256"],
                    [tokenId, user1.address, recipient, destinationChain, await time.latest()]
                )
            );

            const transfer = await lotwise.crossChainTransfers(transferId);
            expect(transfer.tokenId).to.equal(tokenId);
            expect(transfer.from).to.equal(user1.address);
            expect(transfer.to).to.equal(recipient);
            expect(transfer.destinationChain).to.equal(destinationChain);
            expect(transfer.completed).to.be.false;
        });

        it("Should not allow transfer to same chain", async function () {
            const tokenId = 1;
            const destinationChain = CHAIN_ID_SEPOLIA; // Same as current chain
            const recipient = user2.address;
            const fee = ethers.utils.parseEther("0.001");

            await expect(
                lotwise.connect(user1).transferCrossChain(
                    tokenId,
                    destinationChain,
                    recipient,
                    { value: fee }
                )
            ).to.be.revertedWith("Cannot transfer to same chain");
        });

        it("Should not allow transfer of listed token", async function () {
            const tokenId = 1;
            const price = ethers.utils.parseEther("1200");

            // List token
            await lotwise.connect(user1).listToken(tokenId, price);

            const destinationChain = CHAIN_ID_MUMBAI;
            const recipient = user2.address;
            const fee = ethers.utils.parseEther("0.001");

            await expect(
                lotwise.connect(user1).transferCrossChain(
                    tokenId,
                    destinationChain,
                    recipient,
                    { value: fee }
                )
            ).to.be.revertedWith("Token is listed for sale");
        });

        it("Should not allow transfer without sufficient fee", async function () {
            const tokenId = 1;
            const destinationChain = CHAIN_ID_MUMBAI;
            const recipient = user2.address;
            const insufficientFee = ethers.utils.parseEther("0.0001"); // Too low

            await expect(
                lotwise.connect(user1).transferCrossChain(
                    tokenId,
                    destinationChain,
                    recipient,
                    { value: insufficientFee }
                )
            ).to.be.revertedWith("Insufficient fee");
        });
    });

    describe("CCIP Message Handling", function () {
        it("Should handle incoming CCIP message", async function () {
            const tokenId = 1;
            const recipient = user2.address;
            const transferId = ethers.utils.randomBytes(32);

            // Create property and mint token
            await lotwise.createProperty(
                "PROP001",
                ethers.utils.parseEther("1000000"),
                ethers.utils.parseEther("1000"),
                "ipfs://QmTestMetadata"
            );

            // Simulate incoming CCIP message
            const messageData = ethers.utils.defaultAbiCoder.encode(
                ["uint256", "address", "bytes32"],
                [tokenId, recipient, transferId]
            );

            const message = {
                sourceChainSelector: CHAIN_ID_MUMBAI,
                sender: mockRouter.address,
                data: messageData,
                tokenAmounts: [],
                feeToken: ethers.constants.AddressZero,
                extraArgs: "0x"
            };

            await lotwise._ccipReceive(message);

            // Check token is minted on destination chain
            expect(await lotwise.ownerOf(tokenId)).to.equal(recipient);

            // Check transfer is marked as completed
            const transfer = await lotwise.crossChainTransfers(transferId);
            expect(transfer.completed).to.be.true;
        });

        it("Should not process duplicate transfer", async function () {
            const tokenId = 1;
            const recipient = user2.address;
            const transferId = ethers.utils.randomBytes(32);

            // Create property
            await lotwise.createProperty(
                "PROP001",
                ethers.utils.parseEther("1000000"),
                ethers.utils.parseEther("1000"),
                "ipfs://QmTestMetadata"
            );

            const messageData = ethers.utils.defaultAbiCoder.encode(
                ["uint256", "address", "bytes32"],
                [tokenId, recipient, transferId]
            );

            const message = {
                sourceChainSelector: CHAIN_ID_MUMBAI,
                sender: mockRouter.address,
                data: messageData,
                tokenAmounts: [],
                feeToken: ethers.constants.AddressZero,
                extraArgs: "0x"
            };

            // Process message first time
            await lotwise._ccipReceive(message);

            // Try to process same message again
            await expect(lotwise._ccipReceive(message)).to.be.revertedWith("Transfer already completed");
        });
    });

    describe("Transfer Status Tracking", function () {
        it("Should track transfer status correctly", async function () {
            const tokenId = 1;
            const destinationChain = CHAIN_ID_MUMBAI;
            const recipient = user2.address;
            const fee = ethers.utils.parseEther("0.001");

            // Create property and mint token
            await lotwise.createProperty(
                "PROP001",
                ethers.utils.parseEther("1000000"),
                ethers.utils.parseEther("1000"),
                "ipfs://QmTestMetadata"
            );
            await lotwise.mintPropertyTokens(1, user1.address, 1);

            // Mock router
            const messageId = ethers.utils.randomBytes(32);
            await mockRouter.setNextMessageId(messageId);

            // Initiate transfer
            await lotwise.connect(user1).transferCrossChain(
                tokenId,
                destinationChain,
                recipient,
                { value: fee }
            );

            // Get transfer ID
            const transferId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["uint256", "address", "address", "uint64", "uint256"],
                    [tokenId, user1.address, recipient, destinationChain, await time.latest()]
                )
            );

            // Check transfer status
            const transfer = await lotwise.getTransferStatus(transferId);
            expect(transfer.tokenId).to.equal(tokenId);
            expect(transfer.from).to.equal(user1.address);
            expect(transfer.to).to.equal(recipient);
            expect(transfer.destinationChain).to.equal(destinationChain);
            expect(transfer.completed).to.be.false;
        });
    });

    describe("Emergency Functions", function () {
        it("Should pause and unpause contract", async function () {
            expect(await lotwise.emergencyPaused()).to.be.false;

            await lotwise.pauseContract();
            expect(await lotwise.emergencyPaused()).to.be.true;

            await lotwise.unpauseContract();
            expect(await lotwise.emergencyPaused()).to.be.false;
        });

        it("Should not allow transfers when paused", async function () {
            await lotwise.pauseContract();

            const tokenId = 1;
            const destinationChain = CHAIN_ID_MUMBAI;
            const recipient = user2.address;
            const fee = ethers.utils.parseEther("0.001");

            await expect(
                lotwise.connect(user1).transferCrossChain(
                    tokenId,
                    destinationChain,
                    recipient,
                    { value: fee }
                )
            ).to.be.revertedWith("Contract is paused");
        });

        it("Should not allow non-owner to pause", async function () {
            await expect(
                lotwise.connect(user1).pauseContract()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Gas Optimization", function () {
        it("Should estimate gas costs accurately", async function () {
            const tokenId = 1;
            const destinationChain = CHAIN_ID_MUMBAI;
            const recipient = user2.address;

            const gasEstimate = await lotwise.estimateTransferFee.estimateGas(
                tokenId,
                destinationChain,
                recipient
            );

            expect(gasEstimate).to.be.gt(0);
            expect(gasEstimate).to.be.lt(500000); // Should be reasonable
        });
    });

    describe("Integration Tests", function () {
        it("Should complete full cross-chain transfer flow", async function () {
            // 1. Create property
            await lotwise.createProperty(
                "PROP001",
                ethers.utils.parseEther("1000000"),
                ethers.utils.parseEther("1000"),
                "ipfs://QmTestMetadata"
            );

            // 2. Mint tokens
            await lotwise.mintPropertyTokens(1, user1.address, 5);

            // 3. List some tokens
            await lotwise.connect(user1).listToken(1, ethers.utils.parseEther("1200"));
            await lotwise.connect(user2).buyToken(1, { value: ethers.utils.parseEther("0.6") });

            // 4. Transfer remaining tokens cross-chain
            const fee = ethers.utils.parseEther("0.001");
            const messageId = ethers.utils.randomBytes(32);
            await mockRouter.setNextMessageId(messageId);

            await lotwise.connect(user1).transferCrossChain(
                2, // tokenId
                CHAIN_ID_MUMBAI,
                user2.address,
                { value: fee }
            );

            // 5. Verify transfer
            await expect(lotwise.ownerOf(2)).to.be.revertedWith("ERC721: invalid token ID");

            // 6. Simulate completion on destination chain
            const transferId = ethers.utils.keccak256(
                ethers.utils.defaultAbiCoder.encode(
                    ["uint256", "address", "address", "uint64", "uint256"],
                    [2, user1.address, user2.address, CHAIN_ID_MUMBAI, await time.latest()]
                )
            );

            const messageData = ethers.utils.defaultAbiCoder.encode(
                ["uint256", "address", "bytes32"],
                [2, user2.address, transferId]
            );

            const message = {
                sourceChainSelector: CHAIN_ID_MUMBAI,
                sender: mockRouter.address,
                data: messageData,
                tokenAmounts: [],
                feeToken: ethers.constants.AddressZero,
                extraArgs: "0x"
            };

            await lotwise._ccipReceive(message);

            // 7. Verify completion
            expect(await lotwise.ownerOf(2)).to.equal(user2.address);
        });
    });
});

// Mock contracts for testing
describe("Mock Contracts", function () {
    it("Should deploy mock CCIP router", async function () {
        const MockRouter = await ethers.getContractFactory("MockCCIPRouter");
        const router = await MockRouter.deploy();
        await router.deployed();

        expect(router.address).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should deploy mock price feeds", async function () {
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
        const priceFeed = await MockV3Aggregator.deploy(8, 200000000000);
        await priceFeed.deployed();

        const roundData = await priceFeed.latestRoundData();
        expect(roundData.answer).to.equal(200000000000);
    });
}); 