const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lotwise CCIP Cross-Chain Transfer", function () {
    let lotwise, owner, user1, user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy Lotwise with mock router
        const Lotwise = await ethers.getContractFactory("Lotwise");
        lotwise = await Lotwise.deploy(
            ethers.ZeroAddress, // Mock ETH price feed
            ethers.ZeroAddress, // Mock MATIC price feed
            11155111, // Sepolia chain ID
            ethers.ZeroAddress // Mock CCIP router
        );

        // Create a test property
        await lotwise.createProperty(
            "TEST-PROP-001",
            ethers.parseEther("1000000"), // $1M property
            "ipfs://test-metadata"
        );

        // Mint a token to user1
        await lotwise.mintToken(1, 1, user1.address);
    });

    describe("CCIP Configuration", function () {
        it("Should support multiple chains", async function () {
            expect(await lotwise.supportedChains(1)).to.be.true; // Ethereum
            expect(await lotwise.supportedChains(137)).to.be.true; // Polygon
            expect(await lotwise.supportedChains(11155111)).to.be.true; // Sepolia
            expect(await lotwise.supportedChains(80001)).to.be.true; // Mumbai
        });
    });

    describe("Cross-Chain Transfer", function () {
        it("Should prevent transfer to same chain", async function () {
            const tokenId = 1;

            await expect(
                lotwise.connect(user1).transferCrossChain(tokenId, 11155111, user2.address)
            ).to.be.revertedWith("Cannot transfer to same chain");
        });

        it("Should prevent transfer to unsupported chain", async function () {
            const tokenId = 1;

            await expect(
                lotwise.connect(user1).transferCrossChain(tokenId, 999, user2.address)
            ).to.be.revertedWith("Unsupported chain");
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update chain router", async function () {
            const newRouter = ethers.Wallet.createRandom().address;
            await lotwise.updateChainRouter(1, newRouter);
            expect(await lotwise.chainSelectors(1)).to.equal(newRouter);
        });

        it("Should allow owner to set chain support", async function () {
            await lotwise.setChainSupport(999, true);
            expect(await lotwise.supportedChains(999)).to.be.true;

            await lotwise.setChainSupport(999, false);
            expect(await lotwise.supportedChains(999)).to.be.false;
        });

        it("Should prevent non-owner from updating chain router", async function () {
            const newRouter = ethers.Wallet.createRandom().address;
            await expect(
                lotwise.connect(user1).updateChainRouter(1, newRouter)
            ).to.be.revertedWith("Not authorized");
        });
    });
});

// Mock contracts for testing
describe("Mock CCIP Contracts", function () {
    it("Should deploy mock router", async function () {
        const MockRouter = await ethers.getContractFactory("MockCCIPRouter");
        const router = await MockRouter.deploy();
        expect(await router.getAddress()).to.be.properAddress;
    });
}); 