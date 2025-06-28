const { ethers } = require("hardhat");

async function main() {
  console.log("🏔️  Deploying Lotwise to Avalanche Fuji Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Check account balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "AVAX");

  // Get Fuji price feed address for AVAX/USD
  const priceFeedAddress = process.env.FUJI_AVAX_USD_PRICE_FEED || "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD";
  console.log("Using AVAX/USD price feed at:", priceFeedAddress);

  // Deploy the Lotwise contract
  console.log("\n📋 Deploying Lotwise contract...");
  const Lotwise = await ethers.getContractFactory("Lotwise");
  const lotwise = await Lotwise.deploy(priceFeedAddress);

  await lotwise.waitForDeployment();
  const contractAddress = await lotwise.getAddress();

  console.log("✅ Lotwise deployed to:", contractAddress);
  console.log("🔗 Network: Avalanche Fuji Testnet (Chain ID: 43113)");
  console.log("🌐 Explorer: https://testnet.snowtrace.io/address/" + contractAddress);

  // Wait for a few block confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await lotwise.deploymentTransaction().wait(3);

  // Verify the contract deployment by calling a view function
  try {
    const fee = await lotwise.listingFee();
    console.log("✅ Contract verification successful - Listing fee:", ethers.formatEther(fee), "AVAX");
  } catch (error) {
    console.log("⚠️  Could not verify contract deployment:", error.message);
  }

  // Create deployment summary
  const deploymentInfo = {
    network: "Avalanche Fuji Testnet",
    chainId: 43113,
    contractAddress: contractAddress,
    deployer: deployer.address,
    priceFeed: priceFeedAddress,
    explorer: `https://testnet.snowtrace.io/address/${contractAddress}`,
    timestamp: new Date().toISOString(),
    blockNumber: await deployer.provider.getBlockNumber()
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save deployment info to file
  const fs = require("fs");
  const path = require("path");
  
  try {
    fs.writeFileSync(
      path.join(__dirname, "..", "FUJI_DEPLOYMENT.md"),
      `# Lotwise Deployment - Avalanche Fuji Testnet

## Deployment Information

- **Network:** ${deploymentInfo.network}
- **Chain ID:** ${deploymentInfo.chainId}
- **Contract Address:** \`${deploymentInfo.contractAddress}\`
- **Deployer:** \`${deploymentInfo.deployer}\`
- **Price Feed:** \`${deploymentInfo.priceFeed}\` (AVAX/USD)
- **Block Number:** ${deploymentInfo.blockNumber}
- **Timestamp:** ${deploymentInfo.timestamp}

## Explorer Links

- **Contract:** [View on Snowtrace](${deploymentInfo.explorer})
- **Deployer:** [View on Snowtrace](https://testnet.snowtrace.io/address/${deploymentInfo.deployer})

## Network Details

- **RPC URL:** https://api.avax-test.network/ext/bc/C/rpc
- **Chain ID:** 43113
- **Currency:** AVAX
- **Explorer:** https://testnet.snowtrace.io

## Usage

To interact with this contract:

\`\`\`bash
# Using Hardhat
npx hardhat run scripts/interact.js --network fuji

# Or use the contract address directly
# ${deploymentInfo.contractAddress}
\`\`\`

## Next Steps

1. Verify the contract on Snowtrace (if auto-verification failed)
2. Test basic functionality (list property, buy property, etc.)
3. Update frontend configuration to include Fuji network
4. Consider deploying to Avalanche mainnet for production

---
*Deployed on ${deploymentInfo.timestamp}*
`
    );
    
    console.log("📝 Deployment info saved to FUJI_DEPLOYMENT.md");
  } catch (error) {
    console.log("⚠️  Could not save deployment info:", error.message);
  }

  console.log("\n🎉 Deployment complete!");
  console.log("🔗 Add this network to MetaMask:");
  console.log("   Network Name: Avalanche Fuji Testnet");
  console.log("   RPC URL: https://api.avax-test.network/ext/bc/C/rpc");
  console.log("   Chain ID: 43113");
  console.log("   Currency: AVAX");
  console.log("   Explorer: https://testnet.snowtrace.io");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
