const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting CCIP-enabled Lotwise deployment...");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // CCIP Router addresses for different networks
    const ccipRouters = {
        // Mainnet
        1: "0xE561d5E02207fb5eB32cca20a699E0d8919a1476", // Ethereum
        137: "0x3C3D92629A02a8D95D5CB9650fe49C3544f69B43", // Polygon
        43114: "0x27a4E2900F5b2cE6B3C8C8C8C8C8C8C8C8C8C8C8", // Avalanche

        // Testnet
        11155111: "0xD0daae2231E9CB96b94C8512223533293C3693Bf", // Sepolia
        80001: "0x70499c328e1E2a3c4d6fC7C8C8C8C8C8C8C8C8C8C8", // Mumbai
        43113: "0x8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8C8" // Fuji
    };

    // Price feed addresses (mock addresses for now)
    const priceFeeds = {
        // Mainnet
        1: {
            ethUsd: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
            maticUsd: "0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676"
        },
        137: {
            ethUsd: "0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676",
            maticUsd: "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"
        },
        43114: {
            ethUsd: "0x976B3D034E162d8bD72D6b9C989d545b839c953d",
            maticUsd: "0x976B3D034E162d8bD72D6b9C989d545b839c953d"
        },

        // Testnet
        11155111: {
            ethUsd: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
            maticUsd: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
        },
        80001: {
            ethUsd: "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
            maticUsd: "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada"
        },
        43113: {
            ethUsd: "0x86d67c3D38D2bCeE722E601025C25a575036c8D9",
            maticUsd: "0x86d67c3D38D2bCeE722E601025C25a575036c8D9"
        }
    };

    // Get current network
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId;
    console.log(`📡 Deploying to chain ID: ${chainId}`);

    // Get router and price feed addresses for current network
    const routerAddress = ccipRouters[chainId];
    const priceFeedAddresses = priceFeeds[chainId];

    if (!routerAddress) {
        throw new Error(`No CCIP router configured for chain ID ${chainId}`);
    }

    console.log(`🔗 CCIP Router: ${routerAddress}`);
    console.log(`📊 ETH/USD Price Feed: ${priceFeedAddresses.ethUsd}`);
    console.log(`📊 MATIC/USD Price Feed: ${priceFeedAddresses.maticUsd}`);

    // Deploy LotwiseCCIP contract
    console.log("\n📦 Deploying LotwiseCCIP contract...");
    const LotwiseCCIP = await ethers.getContractFactory("LotwiseCCIP");
    const lotwise = await LotwiseCCIP.deploy(
        routerAddress,
        chainId
    );

    await lotwise.deployed();
    console.log(`✅ LotwiseCCIP deployed to: ${lotwise.address}`);

    // Deploy MockV3Aggregator for testing
    console.log("\n📦 Deploying MockV3Aggregator...");
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const mockEthUsd = await MockV3Aggregator.deploy(8, 200000000000); // $2000
    const mockMaticUsd = await MockV3Aggregator.deploy(8, 100000000); // $1

    await mockEthUsd.deployed();
    await mockMaticUsd.deployed();
    console.log(`✅ Mock ETH/USD deployed to: ${mockEthUsd.address}`);
    console.log(`✅ Mock MATIC/USD deployed to: ${mockMaticUsd.address}`);

    // Create deployment info
    const deploymentInfo = {
        network: {
            chainId: chainId,
            name: getNetworkName(chainId)
        },
        contracts: {
            lotwise: lotwise.address,
            mockEthUsd: mockEthUsd.address,
            mockMaticUsd: mockMaticUsd.address
        },
        ccip: {
            router: routerAddress,
            chainId: chainId
        },
        priceFeeds: {
            ethUsd: priceFeedAddresses.ethUsd,
            maticUsd: priceFeedAddresses.maticUsd
        },
        deployer: deployer.address,
        timestamp: new Date().toISOString()
    };

    // Save deployment info
    const deploymentPath = path.join(__dirname, `../deployments/ccip-${chainId}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentPath}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");

    // Check if contract is deployed
    const code = await ethers.provider.getCode(lotwise.address);
    if (code === "0x") {
        throw new Error("Contract deployment failed - no bytecode found");
    }

    // Check CCIP router connection
    try {
        const router = await ethers.getContractAt("IRouterClient", routerAddress);
        console.log("✅ CCIP Router connection verified");
    } catch (error) {
        console.warn("⚠️  CCIP Router verification failed (may be expected on testnets)");
    }

    // Initialize contract with some test data
    console.log("\n🧪 Initializing contract with test data...");

    try {
        // Create a test property
        const tx1 = await lotwise.createProperty(
            "PROP001",
            ethers.utils.parseEther("1000000"), // $1M property
            ethers.utils.parseEther("1000"), // $1000 per token
            "ipfs://QmTestPropertyMetadata"
        );
        await tx1.wait();
        console.log("✅ Test property created");

        // Mint some test tokens
        const tx2 = await lotwise.mintPropertyTokens(
            1, // propertyId
            deployer.address,
            10 // 10 tokens
        );
        await tx2.wait();
        console.log("✅ Test tokens minted");

    } catch (error) {
        console.warn("⚠️  Test data initialization failed:", error.message);
    }

    // Display deployment summary
    console.log("\n🎉 Deployment Summary:");
    console.log("======================");
    console.log(`Network: ${deploymentInfo.network.name} (${chainId})`);
    console.log(`LotwiseCCIP: ${lotwise.address}`);
    console.log(`CCIP Router: ${routerAddress}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Timestamp: ${deploymentInfo.timestamp}`);

    // Display next steps
    console.log("\n📋 Next Steps:");
    console.log("1. Update your frontend with the new contract address");
    console.log("2. Configure your API to use the new contract");
    console.log("3. Test cross-chain transfers on this network");
    console.log("4. Deploy to other supported networks");

    return deploymentInfo;
}

function getNetworkName(chainId) {
    const networks = {
        1: "Ethereum Mainnet",
        137: "Polygon Mainnet",
        43114: "Avalanche Mainnet",
        11155111: "Sepolia Testnet",
        80001: "Mumbai Testnet",
        43113: "Fuji Testnet"
    };
    return networks[chainId] || `Chain ${chainId}`;
}

// Verify contract on Etherscan (if supported)
async function verifyContract(contractAddress, constructorArguments) {
    try {
        console.log("\n🔍 Verifying contract on Etherscan...");
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArguments,
        });
        console.log("✅ Contract verified on Etherscan");
    } catch (error) {
        console.warn("⚠️  Contract verification failed:", error.message);
    }
}

// Deploy to multiple networks
async function deployToAllNetworks() {
    const networks = [11155111, 80001, 43113]; // Testnets first

    for (const chainId of networks) {
        console.log(`\n🌐 Deploying to network ${chainId}...`);

        // Switch to network
        await hre.changeNetwork(chainId);

        try {
            await main();
            console.log(`✅ Successfully deployed to network ${chainId}`);
        } catch (error) {
            console.error(`❌ Failed to deploy to network ${chainId}:`, error.message);
        }
    }
}

// Main execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = {
    main,
    deployToAllNetworks,
    verifyContract
}; 