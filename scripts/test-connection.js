const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Testing Sepolia Connection...\n");
    
    try {
        // Get the signer
        const [signer] = await ethers.getSigners();
        console.log("✅ Connected to Sepolia");
        console.log("📍 Account:", signer.address);
        
        // Get balance
        const balance = await ethers.provider.getBalance(signer.address);
        console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
        
        // Get network info
        const network = await ethers.provider.getNetwork();
        console.log("🌐 Network:", network.name, "| Chain ID:", network.chainId.toString());
        
        // Get current block number
        const blockNumber = await ethers.provider.getBlockNumber();
        console.log("📦 Latest Block:", blockNumber);
        
        console.log("\n✅ Connection test successful!");
        
    } catch (error) {
        console.error("❌ Connection failed:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
