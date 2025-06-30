const { ethers } = require("hardhat");

async function main() {
    console.log("📊 Testing LotwisePriceFeeds Contract...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Testing with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Contract addresses from deployment
    const priceFeedsAddress = "0x5C8b5C8b5C8b5C8b5C8b5C8b5C8b5C8b5C8b5C8b";

    // Attach to deployed contract
    const LotwisePriceFeeds = await ethers.getContractFactory("LotwisePriceFeeds");
    const priceFeeds = await LotwisePriceFeeds.attach(priceFeedsAddress);

    console.log("📋 Contract Details:");
    console.log("   Price Feeds Address:", priceFeedsAddress);
    console.log("   Price Feeds Owner:", await priceFeeds.owner());
    console.log("   ETH/USD Feed:", await priceFeeds.ethUsdPriceFeed());
    console.log("   BTC/USD Feed:", await priceFeeds.btcUsdPriceFeed());
    console.log("   AVAX/USD Feed:", await priceFeeds.avaxUsdPriceFeed(), "\n");

    try {
        // Test 1: Get ETH/USD price
        console.log("💰 Test 1: Getting ETH/USD price...");
        const ethPrice = await priceFeeds.getEthUsdPrice();
        console.log("✅ ETH/USD Price:", ethers.formatUnits(ethPrice, 8), "USD");

        // Test 2: Get BTC/USD price
        console.log("\n💰 Test 2: Getting BTC/USD price...");
        const btcPrice = await priceFeeds.getBtcUsdPrice();
        console.log("✅ BTC/USD Price:", ethers.formatUnits(btcPrice, 8), "USD");

        // Test 3: Get AVAX/USD price
        console.log("\n💰 Test 3: Getting AVAX/USD price...");
        const avaxPrice = await priceFeeds.getAvaxUsdPrice();
        console.log("✅ AVAX/USD Price:", ethers.formatUnits(avaxPrice, 8), "USD");

        // Test 4: Get all prices at once
        console.log("\n📊 Test 4: Getting all prices...");
        const allPrices = await priceFeeds.getAllPrices();
        console.log("✅ All Prices:");
        console.log("   ETH/USD:", ethers.formatUnits(allPrices.ethUsd, 8), "USD");
        console.log("   BTC/USD:", ethers.formatUnits(allPrices.btcUsd, 8), "USD");
        console.log("   AVAX/USD:", ethers.formatUnits(allPrices.avaxUsd, 8), "USD");

        // Test 5: Update price feed addresses
        console.log("\n⚙️  Test 5: Testing price feed address updates...");
        const currentEthFeed = await priceFeeds.ethUsdPriceFeed();
        const currentBtcFeed = await priceFeeds.btcUsdPriceFeed();
        const currentAvaxFeed = await priceFeeds.avaxUsdPriceFeed();

        console.log("✅ Current feed addresses:");
        console.log("   ETH Feed:", currentEthFeed);
        console.log("   BTC Feed:", currentBtcFeed);
        console.log("   AVAX Feed:", currentAvaxFeed);

        // Update with same addresses (for demo)
        const updateTx = await priceFeeds.updatePriceFeeds(
            currentEthFeed,
            currentBtcFeed,
            currentAvaxFeed
        );
        await updateTx.wait();
        console.log("✅ Price feed addresses updated successfully!");
        console.log("   Transaction hash:", updateTx.hash);

        console.log("\n" + "=".repeat(60));
        console.log("🎉 LOTWISE PRICE FEEDS TESTING COMPLETE!");
        console.log("=".repeat(60));
        console.log("✅ All tests passed successfully!");
        console.log("✅ ETH/USD price feed: Working");
        console.log("✅ BTC/USD price feed: Working");
        console.log("✅ AVAX/USD price feed: Working");
        console.log("✅ Batch price retrieval: Working");
        console.log("✅ Feed address updates: Working");
        console.log("=".repeat(60));

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

// Handle script execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("💥 Testing failed:", error);
            process.exit(1);
        });
} 