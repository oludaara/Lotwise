const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Enhanced Lotwise Contracts with Chainlink Integration...");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", (await deployer.getBalance()).toString());

    // Network configuration
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name, "Chain ID:", network.chainId);

    // Chainlink configuration based on network
    let chainlinkConfig;
    if (network.chainId === 11155111) { // Sepolia
        chainlinkConfig = {
            ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
            vrfCoordinator: "0x50AE5Ea4F0fC0C3fE8dE96e22424e1334Acc7502",
            vrfKeyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
            vrfSubscriptionId: 777 // Replace with your subscription ID
        };
    } else if (network.chainId === 43113) { // Fuji (Avalanche testnet)
        chainlinkConfig = {
            ethUsdPriceFeed: "0x86d67c3D38D2bCeE722E601025C25a575006c689",
            vrfCoordinator: "0x2eD832Ba664535e5886b75D64C1144604c444E55",
            vrfKeyHash: "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61",
            vrfSubscriptionId: 777 // Replace with your subscription ID
        };
    } else {
        throw new Error("Unsupported network");
    }

    console.log("🔗 Chainlink Configuration:", chainlinkConfig);

    // Deploy LotwiseCore
    console.log("\n📦 Deploying LotwiseCore...");
    const LotwiseCore = await ethers.getContractFactory("LotwiseCore");
    const lotwiseCore = await LotwiseCore.deploy();
    await lotwiseCore.deployed();
    console.log("✅ LotwiseCore deployed to:", lotwiseCore.address);

    // Deploy LotwisePriceFeeds
    console.log("\n📊 Deploying LotwisePriceFeeds...");
    const LotwisePriceFeeds = await ethers.getContractFactory("LotwisePriceFeeds");
    const lotwisePriceFeeds = await LotwisePriceFeeds.deploy(
        chainlinkConfig.ethUsdPriceFeed, // Sepolia
        chainlinkConfig.ethUsdPriceFeed, // Fuji (placeholder)
        chainlinkConfig.ethUsdPriceFeed  // Mumbai (placeholder)
    );
    await lotwisePriceFeeds.deployed();
    console.log("✅ LotwisePriceFeeds deployed to:", lotwisePriceFeeds.address);

    // Deploy LotwiseVRF
    console.log("\n🎲 Deploying LotwiseVRF...");
    const LotwiseVRF = await ethers.getContractFactory("LotwiseVRF");
    const lotwiseVRF = await LotwiseVRF.deploy(
        lotwiseCore.address,
        chainlinkConfig.vrfCoordinator, // Sepolia
        chainlinkConfig.vrfKeyHash,
        chainlinkConfig.vrfSubscriptionId,
        chainlinkConfig.vrfCoordinator, // Fuji (placeholder)
        chainlinkConfig.vrfKeyHash,
        chainlinkConfig.vrfSubscriptionId,
        chainlinkConfig.vrfCoordinator, // Mumbai (placeholder)
        chainlinkConfig.vrfKeyHash,
        chainlinkConfig.vrfSubscriptionId
    );
    await lotwiseVRF.deployed();
    console.log("✅ LotwiseVRF deployed to:", lotwiseVRF.address);

    // Deploy LotwiseMarketplace
    console.log("\n🏪 Deploying LotwiseMarketplace...");
    const LotwiseMarketplace = await ethers.getContractFactory("LotwiseMarketplace");
    const lotwiseMarketplace = await LotwiseMarketplace.deploy(
        lotwiseCore.address,
        lotwisePriceFeeds.address
    );
    await lotwiseMarketplace.deployed();
    console.log("✅ LotwiseMarketplace deployed to:", lotwiseMarketplace.address);

    // Deploy LotwiseFunctions (simplified version)
    console.log("\n🔧 Deploying LotwiseFunctions...");
    const LotwiseFunctions = await ethers.getContractFactory("LotwiseFunctions");
    const lotwiseFunctions = await LotwiseFunctions.deploy(lotwiseCore.address);
    await lotwiseFunctions.deployed();
    console.log("✅ LotwiseFunctions deployed to:", lotwiseFunctions.address);

    // Deploy LotwiseCCIP (simplified version)
    console.log("\n🌐 Deploying LotwiseCCIP...");
    const LotwiseCCIP = await ethers.getContractFactory("LotwiseCCIP");
    const lotwiseCCIP = await LotwiseCCIP.deploy(lotwiseCore.address);
    await lotwiseCCIP.deployed();
    console.log("✅ LotwiseCCIP deployed to:", lotwiseCCIP.address);

    // Grant permissions
    console.log("\n🔐 Setting up permissions...");

    try {
        // Grant marketplace permission to mint tokens
        await lotwiseCore.grantRole(await lotwiseCore.MINTER_ROLE(), lotwiseMarketplace.address);
        console.log("✅ Granted marketplace minting permissions");
    } catch (error) {
        console.log("⚠️  Failed to grant marketplace permissions:", error.message);
    }

    try {
        // Grant VRF contract permission to interact with core
        await lotwiseCore.grantRole(await lotwiseCore.MINTER_ROLE(), lotwiseVRF.address);
        console.log("✅ Granted VRF contract permissions");
    } catch (error) {
        console.log("⚠️  Failed to grant VRF permissions:", error.message);
    }

    try {
        // Grant CCIP contract permission to interact with core
        await lotwiseCore.grantRole(await lotwiseCore.MINTER_ROLE(), lotwiseCCIP.address);
        console.log("✅ Granted CCIP contract permissions");
    } catch (error) {
        console.log("⚠️  Failed to grant CCIP permissions:", error.message);
    }

    console.log("\n🎉 Deployment Complete!");
    console.log("\n📋 Contract Addresses:");
    console.log("LotwiseCore:", lotwiseCore.address);
    console.log("LotwisePriceFeeds:", lotwisePriceFeeds.address);
    console.log("LotwiseVRF:", lotwiseVRF.address);
    console.log("LotwiseMarketplace:", lotwiseMarketplace.address);
    console.log("LotwiseFunctions:", lotwiseFunctions.address);
    console.log("LotwiseCCIP:", lotwiseCCIP.address);

    console.log("\n🔗 Next Steps:");
    console.log("1. Set up VRF subscription on Chainlink VRF portal");
    console.log("2. Update VRF subscription ID in the contract");
    console.log("3. Add consumer addresses to VRF subscription");
    console.log("4. Test price feeds and VRF functionality");
    console.log("5. Test cross-chain transfer functionality");

    // Save deployment info to file
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId,
        deployer: deployer.address,
        contracts: {
            lotwiseCore: lotwiseCore.address,
            lotwisePriceFeeds: lotwisePriceFeeds.address,
            lotwiseVRF: lotwiseVRF.address,
            lotwiseMarketplace: lotwiseMarketplace.address,
            lotwiseFunctions: lotwiseFunctions.address,
            lotwiseCCIP: lotwiseCCIP.address
        },
        chainlinkConfig: chainlinkConfig,
        timestamp: new Date().toISOString()
    };

    const fs = require('fs');
    fs.writeFileSync(
        `deployment-${network.name}-${Date.now()}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\n💾 Deployment info saved to file");

    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 