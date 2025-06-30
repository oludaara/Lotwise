const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Updating VRF Contract with Real Subscription ID...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);

    // Contract addresses
    const vrfAddress = "0x51170080b381279DE2b65BAe3adAb8839C45e1B9";
    
    // Attach to deployed contract
    const LotwiseVRF = await ethers.getContractFactory("LotwiseVRF");
    const vrf = await LotwiseVRF.attach(vrfAddress);
    
    console.log("📋 Current VRF Settings:");
    console.log("   VRF Address:", vrfAddress);
    console.log("   VRF Owner:", await vrf.owner());
    console.log("   VRF Coordinator:", await vrf.vrfCoordinator());
    console.log("   VRF Key Hash:", await vrf.vrfKeyHash());
    console.log("   Current Subscription ID:", (await vrf.vrfSubscriptionId()).toString());
    console.log("   VRF Callback Gas Limit:", (await vrf.vrfCallbackGasLimit()).toString());
    console.log("   VRF Request Confirmations:", (await vrf.vrfRequestConfirmations()).toString(), "\n");

    // Prompt for the real subscription ID
    console.log("🎯 Please enter the subscription ID from Chainlink VRF dashboard:");
    console.log("   Go to: https://vrf.chain.link/sepolia");
    console.log("   Find your subscription and copy the ID");
    console.log("   (It should be a large number like 33073555397084628854981323174766162084760941304577951402292181748009226081305)");
    console.log("");
    
    // Real subscription ID from Chainlink VRF dashboard
    const realSubscriptionId = "33073555397084628854981323174766162084760941304577951402292181748009226081305";
    
    console.log("🔄 Updating VRF settings with real subscription ID...");
    console.log("   Real Subscription ID:", realSubscriptionId);
    
    try {
        // Get current settings
        const currentKeyHash = await vrf.vrfKeyHash();
        const currentGasLimit = await vrf.vrfCallbackGasLimit();
        const currentConfirmations = await vrf.vrfRequestConfirmations();
        
        // Update VRF settings with the real subscription ID
        const updateTx = await vrf.updateVRFSettings(
            currentKeyHash,
            realSubscriptionId,
            currentGasLimit,
            currentConfirmations
        );
        await updateTx.wait();
        
        console.log("✅ VRF settings updated successfully!");
        console.log("   Transaction hash:", updateTx.hash);
        
        // Verify the update
        console.log("\n🔍 Verifying updated settings...");
        const updatedSubscriptionId = await vrf.vrfSubscriptionId();
        console.log("✅ Updated Subscription ID:", updatedSubscriptionId.toString());
        console.log("   Update successful:", updatedSubscriptionId.toString() === realSubscriptionId.toString());
        
        console.log("\n" + "=".repeat(60));
        console.log("🎉 VRF CONTRACT UPDATED!");
        console.log("=".repeat(60));
        console.log("✅ Real subscription ID added");
        console.log("✅ Contract ready for VRF testing");
        console.log("=".repeat(60));
        
        console.log("\n🎯 NEXT STEPS:");
        console.log("1. Make sure your subscription is funded with LINK");
        console.log("2. Add contract as consumer: 0x51170080b381279DE2b65BAe3adAb8839C45e1B9");
        console.log("3. Run: npx hardhat run scripts/test-vrf.js --network sepolia");

    } catch (error) {
        console.error("❌ Update failed:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

// Handle script execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("💥 Update failed:", error);
            process.exit(1);
        });
} 