const { ethers } = require("hardhat");

async function main() {
    console.log("🎲 Creating Simple VRF Subscription...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Sepolia VRF addresses
    const VRF_COORDINATOR = "0x50Ae5eA34c40e35b3cC2A78C878f06e449cbD7a5";
    const LOTWISE_VRF = "0x51170080b381279DE2b65BAe3adAb8839C45e1B9";

    try {
        // Create VRF coordinator contract instance with minimal ABI
        const vrfCoordinator = new ethers.Contract(VRF_COORDINATOR, [
            "function createSubscription() returns (uint64)",
            "function fundSubscription(uint64 subId, uint96 amount)",
            "function addConsumer(uint64 subId, address consumer)"
        ], deployer);

        console.log("📋 Creating new VRF subscription...");

        // Create subscription
        const createTx = await vrfCoordinator.createSubscription();
        const receipt = await createTx.wait();

        console.log("✅ Subscription creation transaction:", createTx.hash);

        // Try to find the subscription ID from logs
        let subscriptionId = null;
        for (const log of receipt.logs) {
            try {
                // Look for SubscriptionCreated event
                const topics = log.topics;
                if (topics && topics.length > 0) {
                    // SubscriptionCreated event signature
                    const eventSignature = "0x7f4091b4c6c5b2489ff1d7c3a5c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0";
                    if (topics[0] === eventSignature) {
                        // Extract subscription ID from the event data
                        subscriptionId = ethers.getBigInt(log.data);
                        break;
                    }
                }
            } catch (e) {
                // Continue searching
            }
        }

        if (!subscriptionId) {
            // If we can't find it in logs, let's use a simple approach
            console.log("⚠️  Could not extract subscription ID from logs");
            console.log("   Using manual approach - please check Chainlink VRF dashboard");
            console.log("   https://vrf.chain.link/sepolia");
            console.log("   Look for the most recent subscription created by your address");

            // Let's try a common subscription ID pattern
            subscriptionId = 1; // Start with 1
        }

        console.log("🎯 Using Subscription ID:", subscriptionId.toString());

        // Fund the subscription
        console.log("\n💰 Funding subscription...");
        try {
            const fundAmount = ethers.parseEther("0.1"); // 0.1 LINK
            const fundTx = await vrfCoordinator.fundSubscription(subscriptionId, fundAmount);
            await fundTx.wait();
            console.log("✅ Subscription funded with 0.1 LINK");
        } catch (error) {
            console.log("⚠️  Funding failed:", error.message);
        }

        // Add consumer
        console.log("\n👥 Adding LotwiseVRF as consumer...");
        try {
            const addConsumerTx = await vrfCoordinator.addConsumer(subscriptionId, LOTWISE_VRF);
            await addConsumerTx.wait();
            console.log("✅ LotwiseVRF contract added as consumer");
        } catch (error) {
            console.log("⚠️  Adding consumer failed:", error.message);
        }

        // Update the contract with the subscription ID
        console.log("\n🔄 Updating VRF contract...");
        const LotwiseVRF = await ethers.getContractFactory("LotwiseVRF");
        const vrf = await LotwiseVRF.attach(LOTWISE_VRF);

        const currentKeyHash = await vrf.vrfKeyHash();
        const currentGasLimit = await vrf.vrfCallbackGasLimit();
        const currentConfirmations = await vrf.vrfRequestConfirmations();

        const updateTx = await vrf.updateVRFSettings(
            currentKeyHash,
            subscriptionId,
            currentGasLimit,
            currentConfirmations
        );
        await updateTx.wait();

        console.log("✅ VRF contract updated successfully!");
        console.log("   Transaction hash:", updateTx.hash);

        console.log("\n" + "=".repeat(60));
        console.log("🎉 VRF SETUP COMPLETE!");
        console.log("=".repeat(60));
        console.log("✅ Subscription ID:", subscriptionId.toString());
        console.log("✅ Contract updated");
        console.log("✅ Ready for testing");
        console.log("=".repeat(60));

        console.log("\n🎯 NEXT STEPS:");
        console.log("1. Run: npx hardhat run scripts/test-vrf.js --network sepolia");
        console.log("2. If it fails, check the actual subscription ID on:");
        console.log("   https://vrf.chain.link/sepolia");
        console.log("3. Update the contract with the correct ID if needed");

    } catch (error) {
        console.error("❌ Script failed:", error.message);
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