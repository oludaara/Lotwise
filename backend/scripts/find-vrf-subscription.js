const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Finding VRF Subscription ID...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Sepolia VRF addresses
    const VRF_COORDINATOR = "0x50Ae5eA34c40e35b3cC2A78C878f06e449cbD7a5";
    const LOTWISE_VRF = "0x51170080b381279DE2b65BAe3adAb8839C45e1B9";

    try {
        // Create VRF coordinator contract instance
        const vrfCoordinator = new ethers.Contract(VRF_COORDINATOR, [
            "function createSubscription() returns (uint64)",
            "function getSubscription(uint64 subId) view returns (uint96 balance, uint64 reqCount, address owner, address[] consumers)",
            "function addConsumer(uint64 subId, address consumer)",
            "function fundSubscription(uint64 subId, uint96 amount)",
            "function removeConsumer(uint64 subId, address consumer)",
            "function cancelSubscription(uint64 subId, address to)",
            "function pendingRequestExists(uint64 subId) view returns (bool)",
            "function owner() view returns (address)"
        ], deployer);

        console.log("📋 VRF Coordinator Details:");
        console.log("   Address:", VRF_COORDINATOR);
        console.log("   Owner:", await vrfCoordinator.owner());
        console.log("   LotwiseVRF Contract:", LOTWISE_VRF, "\n");

        // Try to create a new subscription
        console.log("🆕 Creating new VRF subscription...");
        try {
            const createTx = await vrfCoordinator.createSubscription();
            const receipt = await createTx.wait();

            // Find the subscription ID from the event
            let subscriptionId = null;
            for (const log of receipt.logs) {
                try {
                    const parsedLog = vrfCoordinator.interface.parseLog(log);
                    if (parsedLog.name === 'SubscriptionCreated') {
                        subscriptionId = parsedLog.args.subId;
                        break;
                    }
                } catch (e) {
                    // Skip logs that can't be parsed
                }
            }

            if (subscriptionId) {
                console.log("✅ New subscription created!");
                console.log("   Subscription ID:", subscriptionId.toString());

                // Fund the subscription
                console.log("\n💰 Funding subscription...");
                const fundAmount = ethers.parseEther("0.1"); // 0.1 LINK
                const fundTx = await vrfCoordinator.fundSubscription(subscriptionId, fundAmount);
                await fundTx.wait();
                console.log("✅ Subscription funded with 0.1 LINK");

                // Add consumer
                console.log("\n👥 Adding LotwiseVRF as consumer...");
                const addConsumerTx = await vrfCoordinator.addConsumer(subscriptionId, LOTWISE_VRF);
                await addConsumerTx.wait();
                console.log("✅ LotwiseVRF contract added as consumer");

                // Verify subscription
                console.log("\n🔍 Verifying subscription...");
                const subscription = await vrfCoordinator.getSubscription(subscriptionId);
                console.log("✅ Subscription details:");
                console.log("   Balance:", ethers.formatEther(subscription.balance), "LINK");
                console.log("   Request Count:", subscription.reqCount.toString());
                console.log("   Owner:", subscription.owner);
                console.log("   Consumers:", subscription.consumers.length);

                const isConsumer = subscription.consumers.includes(LOTWISE_VRF);
                console.log("   LotwiseVRF is consumer:", isConsumer);

                console.log("\n" + "=".repeat(60));
                console.log("🎉 NEW VRF SUBSCRIPTION CREATED!");
                console.log("=".repeat(60));
                console.log("✅ Subscription ID:", subscriptionId.toString());
                console.log("✅ Funded with 0.1 LINK");
                console.log("✅ LotwiseVRF added as consumer");
                console.log("✅ Ready for VRF testing");
                console.log("=".repeat(60));

                // Update the contract with the new subscription ID
                console.log("\n🔄 Updating VRF contract with new subscription ID...");
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

                console.log("\n🎯 NEXT STEPS:");
                console.log("1. Run: npx hardhat run scripts/test-vrf.js --network sepolia");
                console.log("2. Check VRF request status on Chainlink dashboard");

            } else {
                console.log("❌ Could not find subscription ID in transaction logs");
            }

        } catch (error) {
            console.log("⚠️  Failed to create subscription:", error.message);
            console.log("   You may need to create it manually on Chainlink VRF dashboard");
        }

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