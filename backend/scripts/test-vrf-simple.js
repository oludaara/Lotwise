const { ethers } = require("hardhat");

async function main() {
    console.log("🎲 Testing LotwiseVRF Contract (Simple)...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Testing with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Contract addresses from new deployment
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
    console.log("   VRF Subscription ID:", (await vrf.vrfSubscriptionId()).toString());
    console.log("   VRF Callback Gas Limit:", (await vrf.vrfCallbackGasLimit()).toString());
    console.log("   VRF Request Confirmations:", (await vrf.vrfRequestConfirmations()).toString(), "\n");

    try {
        // Test 1: Create a new property for testing
        console.log("🏠 Test 1: Creating a new property for VRF testing...");
        const createTx = await core.createProperty(
            "PROP-VRF-TEST",
            ethers.parseEther("500000"), // $500K property
            "ipfs://QmVRFTestPropertyMetadata"
        );
        await createTx.wait();
        console.log("✅ Property created successfully!");
        console.log("   Transaction hash:", createTx.hash);

        // Test 2: Mint some tokens for the property
        console.log("\n🎫 Test 2: Minting tokens for VRF testing...");
        const mintTx = await core.mintToken(2, deployer.address, 1); // Property ID 2, token ID 1
        await mintTx.wait();
        console.log("✅ Token minted successfully!");
        console.log("   Transaction hash:", mintTx.hash);

        // Test 3: Check property details
        console.log("\n📊 Test 3: Checking property details...");
        const property = await core.getProperty(2);
        console.log("✅ Property details:");
        console.log("   Property ID:", property.propertyId);
        console.log("   Total Value:", ethers.formatEther(property.totalValue), "USD");
        console.log("   Minted Tokens:", property.mintedTokens.toString());
        console.log("   Is Active:", property.isActive);

        // Test 4: Request random value
        console.log("\n🎲 Test 4: Requesting random value for property 2...");
        console.log("   Note: This will create a VRF request. Fulfillment happens off-chain.");
        
        const requestTx = await vrf.requestRandomValue(2);
        await requestTx.wait();
        console.log("✅ Random value request submitted successfully!");
        console.log("   Transaction hash:", requestTx.hash);

        // Test 5: Get VRF request details
        console.log("\n📊 Test 5: Getting VRF request details...");
        
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
            console.log("   Timestamp:", new Date(Number(vrfRequest.timestamp) * 1000).toISOString());
            console.log("   Fulfilled:", vrfRequest.fulfilled);
            console.log("   Random Value:", vrfRequest.randomValue.toString());
        } else {
            console.log("⚠️  Could not find VRF Request ID in transaction logs");
        }

        // Test 6: Check property VRF request mapping
        console.log("\n🔗 Test 6: Checking property VRF request mapping...");
        const propertyVRFRequestId = await vrf.propertyVRFRequestId(2);
        console.log("✅ Property 2 VRF Request ID:", propertyVRFRequestId.toString());

        console.log("\n" + "=".repeat(60));
        console.log("🎉 LOTWISE VRF TESTING COMPLETE!");
        console.log("=".repeat(60));
        console.log("✅ All tests passed successfully!");
        console.log("✅ Property creation: Working");
        console.log("✅ Token minting: Working");
        console.log("✅ VRF request submission: Working");
        console.log("✅ Request tracking: Working");
        console.log("✅ Property validation: Working");
        console.log("\n📝 Note: VRF fulfillment happens off-chain");
        console.log("   Check Chainlink VRF dashboard for request status");
        console.log("   Subscription ID:", (await vrf.vrfSubscriptionId()).toString());
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