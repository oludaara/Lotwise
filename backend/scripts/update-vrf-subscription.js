const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Updating VRF Subscription ID...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Contract addresses
    const vrfAddress = "0x51170080b381279DE2b65BAe3adAb8839C45e1B9";

    // New subscription ID
    const newSubscriptionId = "33073555397084628854981323174766162084760941304577951402292181748009226081305";

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

    try {
        // Get current settings
        const currentKeyHash = await vrf.vrfKeyHash();
        const currentGasLimit = await vrf.vrfCallbackGasLimit();
        const currentConfirmations = await vrf.vrfRequestConfirmations();

        console.log("🔄 Updating VRF settings with new subscription ID...");
        console.log("   New Subscription ID:", newSubscriptionId);

        // Update VRF settings with the new subscription ID
        const updateTx = await vrf.updateVRFSettings(
            currentKeyHash,
            newSubscriptionId,
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
        console.log("   Update successful:", updatedSubscriptionId.toString() === newSubscriptionId);

        console.log("\n" + "=".repeat(60));
        console.log("🎉 VRF SUBSCRIPTION UPDATE COMPLETE!");
        console.log("=".repeat(60));
        console.log("✅ Subscription ID updated successfully");
        console.log("✅ Contract ready for VRF testing");
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
            console.error("💥 Update failed:", error);
            process.exit(1);
        });
} 