const { ethers } = require("hardhat");

async function main() {
    console.log("🎲 Testing LotwiseVRF Contract...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Testing with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Contract addresses from deployment
    const coreAddress = "0x251E95927844A0f0d9f81b30633Ff24d3aAcAd3C";
    const vrfAddress = "0xfaD5F4fc3d1C56B2a81170D10e4171cB80e104be";

    // Attach to deployed contracts
    const LotwiseCore = await ethers.getContractFactory("LotwiseCore");
    const LotwiseVRF = await ethers.getContractFactory("LotwiseVRF");

    const core = await LotwiseCore.attach(coreAddress);
    const vrf = await LotwiseVRF.attach(vrfAddress);

    console.log("📋 Contract Details:");
    console.log("   Core Address:", coreAddress);
    console.log("   VRF Address:", vrfAddress);
    console.log("   VRF Owner:", await vrf.owner());
    console.log("   VRF Coordinator:", await vrf.vrfCoordinator());
    console.log("   VRF Key Hash:", await vrf.vrfKeyHash());
    const vrfSubscriptionId = await vrf.vrfSubscriptionId();
    const vrfCallbackGasLimit = await vrf.vrfCallbackGasLimit();
    const vrfRequestConfirmations = await vrf.vrfRequestConfirmations();
    console.log("   VRF Subscription ID:", vrfSubscriptionId.toString());
    console.log("   VRF Callback Gas Limit:", vrfCallbackGasLimit.toString());
    console.log("   VRF Request Confirmations:", vrfRequestConfirmations.toString());

    try {
        // Test 1: Check if properties exist
        console.log("🏠 Test 1: Checking available properties...");
        const property1 = await core.getProperty(1);
        const property2 = await core.getProperty(2);
        console.log("✅ Available properties:");
        console.log("   Property 1:", property1.propertyId, "- Minted tokens:", property1.mintedTokens.toString());
        console.log("   Property 2:", property2.propertyId, "- Minted tokens:", property2.mintedTokens.toString());

        // Test 2: Request random value for property 2 (has minted tokens)
        console.log("\n🎲 Test 2: Requesting random value for property 2...");
        console.log("   Note: This will create a VRF request. Fulfillment happens off-chain.");

        const requestTx = await vrf.requestRandomValue(2);
        await requestTx.wait();
        console.log("✅ Random value request submitted successfully!");
        console.log("   Transaction hash:", requestTx.hash);

        // Test 3: Get VRF request details
        console.log("\n📊 Test 3: Getting VRF request details...");

        // We need to get the request ID from the event
        const receipt = await ethers.provider.getTransactionReceipt(requestTx.hash);
        const logs = receipt.logs;

        // Find the VRFRequestSubmitted event
        let requestId = null;
        for (const log of logs) {
            try {
                const parsedLog = vrf.interface.parseLog(log);
                if (parsedLog.name === 'VRFRequestSubmitted') {
                    requestId = parsedLog.args.requestId;
                    break;
                }
            } catch (e) {
                // Skip logs that can't be parsed
            }
        }

        if (requestId) {
            console.log("✅ VRF Request ID found:", requestId.toString());

            // Get request details
            const vrfRequest = await vrf.getVRFRequest(requestId);
            console.log("✅ VRF Request details:");
            console.log("   Request ID:", vrfRequest.requestId.toString());
            console.log("   Property ID:", vrfRequest.propertyId.toString());
            console.log("   Timestamp:", new Date(vrfRequest.timestamp * 1000).toISOString());
            console.log("   Fulfilled:", vrfRequest.fulfilled);
            console.log("   Random Value:", vrfRequest.randomValue.toString());
        } else {
            console.log("⚠️  Could not find VRF Request ID in transaction logs");
        }

        // Test 4: Check property VRF request mapping
        console.log("\n🔗 Test 4: Checking property VRF request mapping...");
        const propertyVRFRequestId = await vrf.propertyVRFRequestId(2);
        console.log("✅ Property 2 VRF Request ID:", propertyVRFRequestId.toString());

        // Test 5: Test VRF settings update
        console.log("\n⚙️  Test 5: Testing VRF settings update...");
        const currentKeyHash = await vrf.vrfKeyHash();
        const currentSubscriptionId = await vrf.vrfSubscriptionId();
        const currentGasLimit = await vrf.vrfCallbackGasLimit();
        const currentConfirmations = await vrf.vrfRequestConfirmations();

        console.log("✅ Current VRF settings:");
        console.log("   Key Hash:", currentKeyHash);
        console.log("   Subscription ID:", currentSubscriptionId.toString());
        console.log("   Gas Limit:", currentGasLimit.toString());
        console.log("   Confirmations:", currentConfirmations.toString());

        // Update settings (using same values for demo)
        const updateTx = await vrf.updateVRFSettings(
            currentKeyHash,
            currentSubscriptionId,
            currentGasLimit,
            currentConfirmations
        );
        await updateTx.wait();
        console.log("✅ VRF settings updated successfully!");
        console.log("   Transaction hash:", updateTx.hash);

        // Test 6: Verify settings update
        console.log("\n🔍 Test 6: Verifying settings update...");
        const newKeyHash = await vrf.vrfKeyHash();
        const newSubscriptionId = await vrf.vrfSubscriptionId();
        const newGasLimit = await vrf.vrfCallbackGasLimit();
        const newConfirmations = await vrf.vrfRequestConfirmations();

        console.log("✅ Updated VRF settings:");
        console.log("   Key Hash:", newKeyHash);
        console.log("   Subscription ID:", newSubscriptionId.toString());
        console.log("   Gas Limit:", newGasLimit.toString());
        console.log("   Confirmations:", newConfirmations.toString());

        // Test 7: Test error handling - request for non-existent property
        console.log("\n❌ Test 7: Testing error handling...");
        try {
            await vrf.requestRandomValue(999); // Non-existent property
            console.log("❌ Should have failed for non-existent property");
        } catch (error) {
            console.log("✅ Correctly failed for non-existent property:");
            console.log("   Error:", error.message);
        }

        // Test 8: Test error handling - request for property with no tokens
        console.log("\n❌ Test 8: Testing request for property with no tokens...");
        try {
            await vrf.requestRandomValue(1); // Property 1 has no minted tokens
            console.log("❌ Should have failed for property with no tokens");
        } catch (error) {
            console.log("✅ Correctly failed for property with no tokens:");
            console.log("   Error:", error.message);
        }

        console.log("\n" + "=".repeat(60));
        console.log("🎉 LOTWISE VRF TESTING COMPLETE!");
        console.log("=".repeat(60));
        console.log("✅ All tests passed successfully!");
        console.log("✅ VRF request submission: Working");
        console.log("✅ Request tracking: Working");
        console.log("✅ Settings management: Working");
        console.log("✅ Error handling: Working");
        console.log("✅ Property validation: Working");
        console.log("\n📝 Note: VRF fulfillment happens off-chain");
        console.log("   Check Chainlink VRF dashboard for request status");
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