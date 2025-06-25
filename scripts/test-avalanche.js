const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Avalanche Network Configuration...\n");

  // Test Fuji testnet connection
  console.log("📡 Testing Fuji testnet connection...");
  try {
    const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    console.log("✅ Fuji Testnet Connected:");
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Latest Block: ${blockNumber}`);
    console.log(`   Network Name: ${network.name || 'avalanche-fuji'}`);
  } catch (error) {
    console.log("❌ Fuji testnet connection failed:", error.message);
  }

  console.log("\n📡 Testing Avalanche mainnet connection...");
  try {
    const provider = new ethers.JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc");
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    console.log("✅ Avalanche Mainnet Connected:");
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Latest Block: ${blockNumber}`);
    console.log(`   Network Name: ${network.name || 'avalanche'}`);
  } catch (error) {
    console.log("❌ Avalanche mainnet connection failed:", error.message);
  }

  // Test price feeds
  console.log("\n💰 Testing Chainlink Price Feeds...");
  
  // Fuji AVAX/USD price feed
  const FUJI_AVAX_USD_FEED = "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD";
  try {
    const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
    const aggregatorABI = [
      "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
      "function decimals() external view returns (uint8)"
    ];
    
    const aggregator = new ethers.Contract(FUJI_AVAX_USD_FEED, aggregatorABI, provider);
    const roundData = await aggregator.latestRoundData();
    const decimals = await aggregator.decimals();
    
    const price = Number(roundData.answer) / (10 ** Number(decimals));
    console.log("✅ Fuji AVAX/USD Price Feed:");
    console.log(`   Address: ${FUJI_AVAX_USD_FEED}`);
    console.log(`   Price: $${price.toFixed(2)}`);
    console.log(`   Updated: ${new Date(Number(roundData.updatedAt) * 1000).toLocaleString()}`);
  } catch (error) {
    console.log("❌ Fuji AVAX/USD price feed failed:", error.message);
  }

  // Test Hardhat configuration
  console.log("\n⚙️  Testing Hardhat Configuration...");
  
  const config = require("../hardhat.config.js");
  
  console.log("Networks configured:");
  Object.keys(config.networks).forEach(network => {
    const net = config.networks[network];
    console.log(`   ${network}: Chain ID ${net.chainId || 'N/A'}`);
  });

  // Check if deployer has funds on Fuji
  console.log("\n💰 Checking Deployer Balance on Fuji...");
  try {
    const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
    const privateKey = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    
    console.log(`✅ Deployer Address: ${wallet.address}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} AVAX`);
    
    if (Number(ethers.formatEther(balance)) < 0.1) {
      console.log("⚠️  Low balance! Get testnet AVAX from: https://faucet.avax.network/");
    }
  } catch (error) {
    console.log("❌ Could not check deployer balance:", error.message);
  }

  console.log("\n🎉 Avalanche configuration test complete!");
  console.log("\nNext steps:");
  console.log("1. Fund your deployer address with testnet AVAX: https://faucet.avax.network/");
  console.log("2. Deploy to Fuji: npm run deploy:fuji");
  console.log("3. Verify contract: npm run verify:fuji -- <CONTRACT_ADDRESS>");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
