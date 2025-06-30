const { ethers } = require("hardhat");

async function main() {
    console.log("🏗️  Deploying LotwiseV2 - Simplified Fractional Real Estate Platform...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Network-specific configurations
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name, "| Chain ID:", network.chainId);

    let ethUsdPriceFeed, vrfCoordinator, vrfKeyHash, vrfSubscriptionId;

    // Configure based on network
    if (network.chainId === 11155111n) { // Sepolia
        console.log("📡 Configuring for Sepolia testnet...");
        ethUsdPriceFeed = "0x694AA1769357215DE4FAC081bf1f309aDC325306";  // ETH/USD on Sepolia
        vrfCoordinator = "0x50ae5ea34c40e35b3cc2a78c878f06e449cbd7a5"; // Sepolia VRF Coordinator
        vrfKeyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; // Sepolia VRF Key Hash
        vrfSubscriptionId = 1234n; // Temporary subscription ID
    } else {
        console.log("⚠️  Unknown network, using mock configuration...");
        ethUsdPriceFeed = "0x0000000000000000000000000000000000000000";
        vrfCoordinator = "0x0000000000000000000000000000000000000000";
        vrfKeyHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
        vrfSubscriptionId = 0n;
    }

    console.log("📈 ETH/USD Price Feed:", ethUsdPriceFeed);
    console.log("🎲 VRF Coordinator:", vrfCoordinator);
    console.log("🎲 VRF Key Hash:", vrfKeyHash);
    console.log("🎲 VRF Subscription ID:", vrfSubscriptionId.toString(), "\n");

    // Deploy LotwiseV2 contract
    console.log("🚀 Deploying LotwiseV2 contract...");

    const LotwiseV2 = await ethers.getContractFactory("LotwiseV2");
    const lotwise = await LotwiseV2.deploy(
        ethUsdPriceFeed,
        vrfCoordinator,
        vrfKeyHash,
        vrfSubscriptionId
    );

    await lotwise.waitForDeployment();
    const contractAddress = await lotwise.getAddress();

    console.log("✅ LotwiseV2 deployed to:", contractAddress);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    try {
        const name = await lotwise.name();
        const symbol = await lotwise.symbol();
        const owner = await lotwise.owner();

        console.log("📛 Name:", name);
        console.log("🏷️  Symbol:", symbol);
        console.log("👑 Owner:", owner);
        console.log("🔗 VRF Coordinator:", await lotwise.vrfCoordinator());
        console.log("🔗 VRF Key Hash:", await lotwise.vrfKeyHash());
        console.log("🔗 VRF Subscription ID:", await lotwise.vrfSubscriptionId());

        // Test basic functionality
        console.log("\n🧪 Testing basic functionality...");

        // Create a sample property
        const createTx = await lotwise.createProperty(
            "PROP-001",
            ethers.parseEther("1000000"), // $1M property
            "ipfs://QmSamplePropertyMetadata"
        );
        await createTx.wait();
        console.log("✅ Sample property created");

        // Get property details
        const property = await lotwise.getProperty(1);
        console.log("🏠 Property Details:");
        console.log("   - ID:", property.propertyId);
        console.log("   - Total Value:", ethers.formatEther(property.totalValue), "USD");
        console.log("   - Token Price:", ethers.formatEther(property.tokenPrice), "USD");
        console.log("   - Total Tokens:", property.totalTokens.toString());
        console.log("   - Active:", property.isActive);

    } catch (error) {
        console.error("❌ Verification failed:", error.message);
    }

    // Save deployment information
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contractAddress: contractAddress,
        deployer: deployer.address,
        ethUsdPriceFeed: ethUsdPriceFeed,
        vrfCoordinator: vrfCoordinator,
        vrfKeyHash: vrfKeyHash,
        vrfSubscriptionId: vrfSubscriptionId.toString(),
        deployedAt: new Date().toISOString(),
        features: [
            "Fractional Ownership (1,000 tokens per property)",
            "Basic Marketplace with USD Pricing",
            "Chainlink Price Feeds",
            "Chainlink VRF Integration",
            "Emergency Pause Functionality"
        ]
    };

    // Write to file
    const fs = require('fs');
    const path = require('path');

    try {
        fs.writeFileSync(
            path.join(__dirname, '../deployment-v2.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );
        console.log("\n💾 Deployment info saved to deployment-v2.json");
    } catch (error) {
        console.error("⚠️  Could not save deployment info:", error.message);
    }

    // Display summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 LOTWISE V2 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("📍 Contract Address:", contractAddress);
    console.log("🌐 Network:", network.name);
    console.log("⛓️  Chain ID:", network.chainId.toString());
    console.log("🔗 Etherscan:", `https://${network.name === 'sepolia' ? 'sepolia.' : ''}etherscan.io/address/${contractAddress}`);
    console.log("\n🎯 Key Features:");
    console.log("   ✅ Fractional ownership (1,000 tokens per $1M property)");
    console.log("   ✅ Basic marketplace functionality");
    console.log("   ✅ Chainlink price feeds integration");
    console.log("   ✅ Chainlink VRF integration");
    console.log("   ✅ Emergency pause functionality");
    console.log("\n🚀 Ready for testing!");
    console.log("=".repeat(60));

    return {
        contract: lotwise,
        address: contractAddress,
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