const { ethers } = require("hardhat");

async function main() {
    console.log("🏗️  Deploying Lotwise Modular Contracts...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Network-specific configurations
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name, "| Chain ID:", network.chainId);

    let ethUsdPriceFeed, maticUsdPriceFeed, vrfCoordinator, vrfKeyHash, vrfSubscriptionId;

    // Configure based on network
    if (network.chainId === 11155111n) { // Sepolia
        console.log("📡 Configuring for Sepolia testnet...");
        ethUsdPriceFeed = "0x694AA1769357215DE4FAC081bf1f309aDC325306";  // ETH/USD on Sepolia
        maticUsdPriceFeed = "0x0000000000000000000000000000000000000000"; // Not available on Sepolia
        vrfCoordinator = "0x50ae5ea34c40e35b3cc2a78c878f06e449cbd7a5"; // Sepolia VRF Coordinator
        vrfKeyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; // Sepolia VRF Key Hash
        vrfSubscriptionId = "33073555397084628854981323174766162084760941304577951402292181748009226081305"; // Real subscription ID
    } else {
        console.log("⚠️  Unknown network, using mock configuration...");
        ethUsdPriceFeed = "0x0000000000000000000000000000000000000000";
        maticUsdPriceFeed = "0x0000000000000000000000000000000000000000";
        vrfCoordinator = "0x0000000000000000000000000000000000000000";
        vrfKeyHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
        vrfSubscriptionId = 0n;
    }

    console.log("📈 ETH/USD Price Feed:", ethUsdPriceFeed);
    console.log("📈 MATIC/USD Price Feed:", maticUsdPriceFeed);
    console.log("🎲 VRF Coordinator:", vrfCoordinator);
    console.log("🎲 VRF Key Hash:", vrfKeyHash);
    console.log("🎲 VRF Subscription ID:", vrfSubscriptionId.toString(), "\n");

    // Deploy contracts in order
    console.log("🚀 Deploying LotwiseCore contract...");
    const LotwiseCore = await ethers.getContractFactory("LotwiseCore");
    const lotwiseCore = await LotwiseCore.deploy();
    await lotwiseCore.waitForDeployment();
    const coreAddress = await lotwiseCore.getAddress();
    console.log("✅ LotwiseCore deployed to:", coreAddress);

    console.log("\n🚀 Deploying LotwiseMarketplace contract...");
    const LotwiseMarketplace = await ethers.getContractFactory("LotwiseMarketplace");
    const lotwiseMarketplace = await LotwiseMarketplace.deploy(coreAddress);
    await lotwiseMarketplace.waitForDeployment();
    const marketplaceAddress = await lotwiseMarketplace.getAddress();
    console.log("✅ LotwiseMarketplace deployed to:", marketplaceAddress);

    console.log("\n🚀 Deploying LotwiseVRF contract...");
    const LotwiseVRF = await ethers.getContractFactory("LotwiseVRF");
    const lotwiseVRF = await LotwiseVRF.deploy(
        coreAddress,
        vrfCoordinator,
        vrfKeyHash,
        vrfSubscriptionId,
        vrfCoordinator,
        vrfKeyHash,
        vrfSubscriptionId,
        vrfCoordinator,
        vrfKeyHash,
        vrfSubscriptionId
    );
    await lotwiseVRF.waitForDeployment();
    const vrfAddress = await lotwiseVRF.getAddress();
    console.log("✅ LotwiseVRF deployed to:", vrfAddress);

    console.log("\n🚀 Deploying LotwisePriceFeeds contract...");
    const LotwisePriceFeeds = await ethers.getContractFactory("LotwisePriceFeeds");
    const lotwisePriceFeeds = await LotwisePriceFeeds.deploy(
        ethUsdPriceFeed,
        maticUsdPriceFeed,
        ethUsdPriceFeed,
        maticUsdPriceFeed,
        ethUsdPriceFeed,
        maticUsdPriceFeed
    );
    await lotwisePriceFeeds.waitForDeployment();
    const priceFeedsAddress = await lotwisePriceFeeds.getAddress();
    console.log("✅ LotwisePriceFeeds deployed to:", priceFeedsAddress);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    try {
        const coreName = await lotwiseCore.name();
        const coreSymbol = await lotwiseCore.symbol();
        const coreOwner = await lotwiseCore.owner();

        console.log("📛 Core Name:", coreName);
        console.log("🏷️  Core Symbol:", coreSymbol);
        console.log("👑 Core Owner:", coreOwner);

        // Test basic functionality
        console.log("\n🧪 Testing basic functionality...");

        // Create a sample property
        const createTx = await lotwiseCore.createProperty(
            "PROP-001",
            ethers.parseEther("1000000"), // $1M property
            "ipfs://QmSamplePropertyMetadata"
        );
        await createTx.wait();
        console.log("✅ Sample property created");

        // Get property details
        const property = await lotwiseCore.getProperty(1);
        console.log("🏠 Property Details:");
        console.log("   - ID:", property.propertyId);
        console.log("   - Total Value:", ethers.formatEther(property.totalValue), "USD");
        console.log("   - Token Price:", ethers.formatEther(property.tokenPrice), "USD");
        console.log("   - Total Tokens:", property.totalTokens.toString());
        console.log("   - Active:", property.isActive);

        // Test price feeds
        const ethPrice = await lotwisePriceFeeds.getLatestEthPrice();
        console.log("💰 ETH Price:", ethPrice.toString());

    } catch (error) {
        console.error("❌ Verification failed:", error.message);
    }

    // Post-deployment verification for multi-network support
    console.log("\n🔄 Verifying multi-network support...");
    const networks = [
        { name: "Sepolia", idx: 0 },
        { name: "Fuji", idx: 1 },
        { name: "Mumbai", idx: 2 }
    ];
    for (const net of networks) {
        console.log(`\n➡️  Switching active network to ${net.name}...`);
        await lotwisePriceFeeds.setActiveNetwork(net.idx);
        await lotwiseVRF.setActiveNetwork(net.idx);
        const activePF = await lotwisePriceFeeds.activeNetwork();
        const activeVRF = await lotwiseVRF.activeNetwork();
        console.log(`LotwisePriceFeeds active network: ${activePF}`);
        console.log(`LotwiseVRF active network: ${activeVRF}`);
        const ethPrice = await lotwisePriceFeeds.getLatestEthPrice();
        console.log(`ETH/USD price on ${net.name}:`, ethPrice.toString());
        const vrfConfig = await lotwiseVRF.vrfConfigs(net.idx);
        console.log(`VRF config for ${net.name}:`, vrfConfig);
    }
    console.log("\n✅ Multi-network verification complete!");

    // Save deployment information
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contracts: {
            lotwiseCore: coreAddress,
            lotwiseMarketplace: marketplaceAddress,
            lotwiseVRF: vrfAddress,
            lotwisePriceFeeds: priceFeedsAddress
        },
        deployer: deployer.address,
        configuration: {
            ethUsdPriceFeed: ethUsdPriceFeed,
            maticUsdPriceFeed: maticUsdPriceFeed,
            vrfCoordinator: vrfCoordinator,
            vrfKeyHash: vrfKeyHash,
            vrfSubscriptionId: vrfSubscriptionId.toString()
        },
        deployedAt: new Date().toISOString(),
        features: [
            "Modular Architecture - Separate contracts for different features",
            "LotwiseCore - Basic ERC721 property tokenization",
            "LotwiseMarketplace - Token buying/selling with fees",
            "LotwiseVRF - Chainlink VRF integration for randomness",
            "LotwisePriceFeeds - Chainlink price feed integration"
        ]
    };

    // Write to file
    const fs = require('fs');
    const path = require('path');

    try {
        fs.writeFileSync(
            path.join(__dirname, '../deployment-modular.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );
        console.log("\n💾 Deployment info saved to deployment-modular.json");
    } catch (error) {
        console.error("⚠️  Could not save deployment info:", error.message);
    }

    // Display summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 LOTWISE MODULAR DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("📍 Contract Addresses:");
    console.log("   🏠 Core:", coreAddress);
    console.log("   🛒 Marketplace:", marketplaceAddress);
    console.log("   🎲 VRF:", vrfAddress);
    console.log("   📈 Price Feeds:", priceFeedsAddress);
    console.log("🌐 Network:", network.name);
    console.log("⛓️  Chain ID:", network.chainId.toString());
    console.log("\n🎯 Key Features:");
    console.log("   ✅ Modular architecture for better maintainability");
    console.log("   ✅ Separate contracts for different functionalities");
    console.log("   ✅ Fractional ownership (1,000 tokens per $1M property)");
    console.log("   ✅ Marketplace with trading fees");
    console.log("   ✅ Chainlink VRF integration");
    console.log("   ✅ Chainlink price feeds integration");
    console.log("\n🚀 Ready for testing!");
    console.log("=".repeat(60));

    return {
        lotwiseCore,
        lotwiseMarketplace,
        lotwiseVRF,
        lotwisePriceFeeds,
        deploymentInfo
    };
}

// Handle script execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("💥 Deployment failed:", error);
            process.exit(1);
        });
} 