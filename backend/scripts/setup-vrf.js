const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Setting up VRF Subscription for Lotwise...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Sepolia VRF addresses
    const VRF_COORDINATOR = "0x50Ae5eA34c40e35b3cC2A78C878f06e449cbD7a5";
    const LINK_TOKEN = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    const LOTWISE_VRF = "0x51170080b381279DE2b65BAe3adAb8839C45e1B9";

    try {
        // Step 1: Check if we have LINK tokens
        console.log("🔗 Step 1: Checking LINK token balance...");
        const linkToken = new ethers.Contract(LINK_TOKEN, [
            "function balanceOf(address owner) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)"
        ], deployer);

        const linkBalance = await linkToken.balanceOf(deployer.address);
        console.log("✅ LINK Balance:", ethers.formatEther(linkBalance), "LINK");

        if (linkBalance < ethers.parseEther("1")) {
            console.log("⚠️  Low LINK balance. You may need to get LINK from Sepolia faucet:");
            console.log("   https://sepoliafaucet.com/");
            console.log("   Or use: https://faucets.chain.link/sepolia");
        }

        // Step 2: Create VRF subscription
        console.log("\n📝 Step 2: Creating VRF subscription...");
        const vrfCoordinator = new ethers.Contract(VRF_COORDINATOR, [
            "function createSubscription() returns (uint64)",
            "function getSubscription(uint64 subId) view returns (uint96 balance, uint64 reqCount, address owner, address[] consumers)",
            "function addConsumer(uint64 subId, address consumer)",
            "function fundSubscription(uint64 subId, uint96 amount)"
        ], deployer);

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
                console.log("✅ New subscription created! ID:", subscriptionId.toString());
            } else {
                console.log("⚠️  Could not find subscription ID in logs");
                console.log("   You may need to create subscription manually on Chainlink VRF dashboard");
            }
        } catch (error) {
            console.log("⚠️  Failed to create subscription:", error.message);
            console.log("   You may need to create it manually on Chainlink VRF dashboard");
        }

        // Step 3: Fund subscription (if we have LINK)
        console.log("\n💰 Step 3: Funding subscription...");
        if (linkBalance > ethers.parseEther("0.1")) {
            try {
                const fundAmount = ethers.parseEther("0.1"); // 0.1 LINK
                const fundTx = await vrfCoordinator.fundSubscription(1234, fundAmount);
                await fundTx.wait();
                console.log("✅ Subscription funded with 0.1 LINK");
            } catch (error) {
                console.log("⚠️  Failed to fund subscription:", error.message);
                console.log("   You may need to fund it manually");
            }
        } else {
            console.log("⚠️  Insufficient LINK balance to fund subscription");
        }

        // Step 4: Add consumer to subscription
        console.log("\n👥 Step 4: Adding LotwiseVRF as consumer...");
        try {
            const addConsumerTx = await vrfCoordinator.addConsumer(1234, LOTWISE_VRF);
            await addConsumerTx.wait();
            console.log("✅ LotwiseVRF contract added as consumer to subscription 1234");
        } catch (error) {
            console.log("⚠️  Failed to add consumer:", error.message);
            console.log("   You may need to add it manually on Chainlink VRF dashboard");
        }

        // Step 5: Verify subscription setup
        console.log("\n🔍 Step 5: Verifying subscription setup...");
        try {
            const subscription = await vrfCoordinator.getSubscription(1234);
            console.log("✅ Subscription 1234 details:");
            console.log("   Balance:", ethers.formatEther(subscription.balance), "LINK");
            console.log("   Request Count:", subscription.reqCount.toString());
            console.log("   Owner:", subscription.owner);
            console.log("   Consumers:", subscription.consumers.length);

            const isConsumer = subscription.consumers.includes(LOTWISE_VRF);
            console.log("   LotwiseVRF is consumer:", isConsumer);
        } catch (error) {
            console.log("❌ Failed to get subscription details:", error.message);
            console.log("   Subscription 1234 may not exist");
        }

        console.log("\n" + "=".repeat(60));
        console.log("🎯 VRF SETUP INSTRUCTIONS");
        console.log("=".repeat(60));
        console.log("If automatic setup failed, follow these manual steps:");
        console.log("");
        console.log("1. Go to: https://vrf.chain.link/sepolia");
        console.log("2. Connect your wallet");
        console.log("3. Create a new subscription");
        console.log("4. Fund it with at least 0.1 LINK");
        console.log("5. Add consumer: 0x51170080b381279DE2b65BAe3adAb8839C45e1B9");
        console.log("6. Note the subscription ID and update the contract");
        console.log("");
        console.log("Get LINK from: https://faucets.chain.link/sepolia");
        console.log("=".repeat(60));

    } catch (error) {
        console.error("❌ Setup failed:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

// Handle script execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("💥 Setup failed:", error);
            process.exit(1);
        });
} 