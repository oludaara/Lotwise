const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Lotwise Contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Chainlink price feed addresses (use zero address for local testing)
  const networkName = hre.network.name;
  let priceFeedAddress = ethers.ZeroAddress; // Default for local testing
  
  if (networkName === "sepolia") {
    priceFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // ETH/USD on Sepolia
  }
  
  console.log("🔗 Using price feed:", priceFeedAddress);

  // Deploy the contract
  const Lotwise = await ethers.getContractFactory("Lotwise");
  const lotwise = await Lotwise.deploy(priceFeedAddress);
  await lotwise.waitForDeployment();

  console.log("✅ Lotwise deployed to:", lotwise.target);

  // Get property details
  const property = await lotwise.getProperty();
  console.log("\n🏠 Property Details:");
  console.log("   Property ID:", property.propertyId);
  console.log("   Total Value:", ethers.formatEther(property.totalValue), "ETH");
  console.log("   Token Price:", ethers.formatEther(property.tokenPrice), "ETH");
  console.log("   Total Tokens:", property.totalTokens.toString());
  console.log("   Is Active:", property.isActive);

  // Get contract info
  console.log("\n📜 Contract Info:");
  console.log("   Name:", await lotwise.name());
  console.log("   Symbol:", await lotwise.symbol());
  console.log("   Owner:", await lotwise.owner());
  console.log("   Total Minted:", (await lotwise.totalMinted()).toString());
  console.log("   Remaining Tokens:", (await lotwise.remainingTokens()).toString());

  // Example: Mint some tokens to deployer for testing
  if (process.env.MINT_INITIAL_TOKENS === "true") {
    console.log("\n🪙 Minting initial tokens...");
    const mintTx = await lotwise.mintTokens(deployer.address, 10);
    await mintTx.wait();
    console.log("   Minted 10 tokens to deployer");
    console.log("   New balance:", (await lotwise.balanceOf(deployer.address)).toString());
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("   1. Verify contract on Etherscan (if on testnet)");
  console.log("   2. Test buying tokens with buyTokens()");
  console.log("   3. Test marketplace with listToken() and buyListedToken()");
  console.log("   4. Start the API: cd api && npm start");
  console.log("   5. Test API endpoint: http://localhost:5000/property/123");

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    contractAddress: lotwise.target,
    deployerAddress: deployer.address,
    network: network.name,
    chainId: Number(network.chainId), // Convert BigInt to number
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    property: {
      id: property.propertyId,
      totalValue: ethers.formatEther(property.totalValue),
      tokenPrice: ethers.formatEther(property.tokenPrice),
      totalTokens: property.totalTokens.toString()
    }
  };

  console.log("\n💾 Deployment info saved to deployment.json");
  require('fs').writeFileSync(
    'deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
