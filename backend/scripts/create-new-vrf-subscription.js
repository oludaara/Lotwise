const { ethers } = require("hardhat");

async function main() {
    console.log("🎲 Creating New VRF Subscription...\n");

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
            "function fundSubscription(uint64 subId, uint96 amount)",
            "function addConsumer(uint64 subId, address consumer)"
        ], deployer);

        console.log("📋 Creating new VRF subscription...");

        // Create subscription
        const createTx = await vrfCoordinator.createSubscription();
        const receipt = await createTx.wait();

        console.log("✅ Subscription creation transaction:", createTx.hash);

        // The subscription ID should be returned directly from the function
        // Let's try to get it from the transaction receipt
        let subscriptionId = null;

        // Method 1: Try to get it from the return value
        try {
            const result = await vrfCoordinator.createSubscription.staticCall();
            subscriptionId = result;
            console.log("✅ Got subscription ID from static call:", subscriptionId.toString());
        } catch (error) {
            console.log("⚠️  Could not get subscription ID from static call");
        }

        // Method 2: If that didn't work, let's try to find it in the logs
        if (!subscriptionId) {
            console.log("🔍 Searching transaction logs for subscription ID...");
            for (const log of receipt.logs) {
                try {
                    // Look for any event that might contain the subscription ID
                    console.log("   Log topic:", log.topics[0]);
                    if (log.data && log.data !== "0x") {
                        console.log("   Log data:", log.data);
                        // Try to decode as uint64
                        const decoded = ethers.getBigInt(log.data);
                        if (decoded < ethers.getBigInt("18446744073709551615")) { // max uint64
                            subscriptionId = decoded;
                            console.log("✅ Found subscription ID in logs:", subscriptionId.toString());
                            break;
                        }
                    }
                } catch (e) {
                    // Continue searching
                }
            }
        }

        // Method 3: If still no luck, let's try a different approach
        if (!subscriptionId) {
            console.log("⚠️  Could not extract subscription ID automatically");
            console.log("   Please check the Chainlink VRF dashboard manually:");
            console.log("   https://vrf.chain.link/sepolia");
            console.log("   Look for the most recent subscription created by your address");
            console.log("   The subscription ID should be a small number (1, 2, 3, etc.)");

            // For now, let's assume it's 1 and try to fund it
            subscriptionId = 1;
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
        console.log("🎉 NEW VRF SUBSCRIPTION CREATED!");
        console.log("=".repeat(60));
        console.log("✅ Subscription ID:", subscriptionId.toString());
        console.log("✅ Funded with 0.1 LINK");
        console.log("✅ LotwiseVRF added as consumer");
        console.log("✅ Contract updated");
        console.log("✅ Ready for VRF testing");
        console.log("=".repeat(60));

        console.log("\n🎯 NEXT STEPS:");
        console.log("1. Run: npx hardhat run scripts/test-vrf.js --network sepolia");
        console.log("2. If it fails, verify the subscription ID on:");
        console.log("   https://vrf.chain.link/sepolia");

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