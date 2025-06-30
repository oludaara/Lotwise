const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking VRF Settings...\n");

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
    console.log("   VRF Subscription ID:", (await vrf.vrfSubscriptionId()).toString());
    console.log("   VRF Callback Gas Limit:", (await vrf.vrfCallbackGasLimit()).toString());
    console.log("   VRF Request Confirmations:", (await vrf.vrfRequestConfirmations()).toString(), "\n");

    // The subscription ID is still the large number, let's fix it
    const correctSubscriptionId = 1; // The subscription we just created

    console.log("🔄 Updating VRF settings with correct subscription ID...");
    console.log("   Correct Subscription ID:", correctSubscriptionId);

    try {
        // Get current settings
        const currentKeyHash = await vrf.vrfKeyHash();
        const currentGasLimit = await vrf.vrfCallbackGasLimit();
        const currentConfirmations = await vrf.vrfRequestConfirmations();

        // Update VRF settings with the correct subscription ID
        const updateTx = await vrf.updateVRFSettings(
            currentKeyHash,
            correctSubscriptionId,
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
        console.log("   Update successful:", updatedSubscriptionId.toString() === correctSubscriptionId.toString());

        console.log("\n" + "=".repeat(60));
        console.log("🎉 VRF SETTINGS UPDATED!");
        console.log("=".repeat(60));
        console.log("✅ Subscription ID corrected");
        console.log("✅ Ready for VRF testing");
        console.log("=".repeat(60));

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
            console.error("💥 Script failed:", error);
            process.exit(1);
        });
} 