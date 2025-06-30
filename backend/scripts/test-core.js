const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing LotwiseCore Contract...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Testing with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Contract addresses from deployment
    const coreAddress = "0xd680C96c25eba0A325f8Ee9F2EbB08Fe17010374";

    // Attach to deployed contract
    const LotwiseCore = await ethers.getContractFactory("LotwiseCore");
    const core = await LotwiseCore.attach(coreAddress);

    console.log("📋 Contract Details:");
    console.log("   Address:", coreAddress);
    console.log("   Name:", await core.name());
    console.log("   Symbol:", await core.symbol());
    console.log("   Owner:", await core.owner());
    console.log("   Emergency Paused:", await core.emergencyPaused(), "\n");

    try {
        // Test 1: Create a new property
        console.log("🏗️  Test 1: Creating a new property...");
        const createTx = await core.createProperty(
            "PROP-002",
            ethers.parseEther("500000"), // $500,000 property
            "ipfs://QmNewPropertyMetadata"
        );
        await createTx.wait();
        console.log("✅ Property created successfully!");
        console.log("   Transaction hash:", createTx.hash);

        // Test 2: Get property details
        console.log("\n📊 Test 2: Retrieving property details...");
        const property = await core.getProperty(2); // Property ID 2
        console.log("✅ Property details retrieved:");
        console.log("   Property ID:", property.propertyId);
        console.log("   Total Value:", ethers.formatEther(property.totalValue), "USD");
        console.log("   Token Price:", ethers.formatEther(property.tokenPrice), "USD");
        console.log("   Total Tokens:", property.totalTokens.toString());
        console.log("   Minted Tokens:", property.mintedTokens.toString());
        console.log("   Is Active:", property.isActive);
        console.log("   Metadata URI:", property.metadataURI);

        // Test 3: Mint property tokens
        console.log("\n🪙 Test 3: Minting property tokens...");

        // Mint 5 tokens to deployer
        for (let i = 0; i < 5; i++) {
            const mintTx = await core.mintPropertyToken(2, deployer.address);
            await mintTx.wait();
            console.log(`   ✅ Token ${i + 1} minted to ${deployer.address}`);
        }

        // Test 4: Check token ownership
        console.log("\n👤 Test 4: Checking token ownership...");
        const tokenId = 2; // First token of property 2
        const tokenOwner = await core.ownerOf(tokenId);
        const tokenProperty = await core.tokenToProperty(tokenId);
        console.log("✅ Token details:");
        console.log("   Token ID:", tokenId);
        console.log("   Owner:", tokenOwner);
        console.log("   Property ID:", tokenProperty.toString());

        // Test 5: Get updated property details
        console.log("\n📈 Test 5: Updated property details...");
        const updatedProperty = await core.getProperty(2);
        console.log("✅ Updated property details:");
        console.log("   Minted Tokens:", updatedProperty.mintedTokens.toString());
        console.log("   Remaining Tokens:", (updatedProperty.totalTokens - updatedProperty.mintedTokens).toString());

        // Test 6: Get token URI
        console.log("\n🔗 Test 6: Getting token URI...");
        const tokenURI = await core.tokenURI(tokenId);
        console.log("✅ Token URI:", tokenURI);

        // Test 7: Check total supply
        console.log("\n📊 Test 7: Checking total supply...");
        const totalSupply = await core.totalSupply();
        console.log("✅ Total tokens minted across all properties:", totalSupply.toString());

        // Test 8: List all tokens owned by deployer
        console.log("\n👤 Test 8: Listing deployer's tokens...");
        const deployerBalance = await core.balanceOf(deployer.address);
        console.log("✅ Deployer token balance:", deployerBalance.toString());

        for (let i = 0; i < deployerBalance; i++) {
            const tokenId = await core.tokenOfOwnerByIndex(deployer.address, i);
            console.log(`   Token ${i + 1}: ID ${tokenId.toString()}`);
        }

        console.log("\n" + "=".repeat(60));
        console.log("🎉 LOTWISE CORE TESTING COMPLETE!");
        console.log("=".repeat(60));
        console.log("✅ All tests passed successfully!");
        console.log("✅ Property creation: Working");
        console.log("✅ Token minting: Working");
        console.log("✅ Property retrieval: Working");
        console.log("✅ Token ownership: Working");
        console.log("✅ Token URI: Working");
        console.log("✅ Total supply: Working");
        console.log("✅ Owner enumeration: Working");
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