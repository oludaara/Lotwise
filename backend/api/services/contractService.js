const { ethers } = require('ethers');
const path = require('path');

class ContractService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.contractAddresses = {
            core: "0xd680C96c25eba0A325f8Ee9F2EbB08Fe17010374",
            marketplace: "0x32f106158A253AA121AaC02eAADd20F96D206439",
            vrf: "0x51170080b381279DE2b65BAe3adAb8839C45e1B9",
            priceFeeds: "0x5C8b5C8b5C8b5C8b5C8b5C8b5C8b5C8b5C8b5C8b"
        };
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize provider for Sepolia
            this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/your-project-id');
            
            // Initialize signer if private key is provided
            if (process.env.PRIVATE_KEY) {
                this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            }

            // Load contract ABIs
            await this.loadContracts();
            console.log('✅ Contract service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize contract service:', error);
        }
    }

    async loadContracts() {
        try {
            // Load contract ABIs from artifacts
            const artifactsPath = path.join(__dirname, '../../artifacts/contracts/lotwise-modules');
            
            // Core contract
            const coreAbi = require(path.join(artifactsPath, 'LotwiseCore.sol/LotwiseCore.json')).abi;
            this.contracts.core = new ethers.Contract(
                this.contractAddresses.core,
                coreAbi,
                this.signer || this.provider
            );

            // Marketplace contract
            const marketplaceAbi = require(path.join(artifactsPath, 'LotwiseMarketplace.sol/LotwiseMarketplace.json')).abi;
            this.contracts.marketplace = new ethers.Contract(
                this.contractAddresses.marketplace,
                marketplaceAbi,
                this.signer || this.provider
            );

            // VRF contract
            const vrfAbi = require(path.join(artifactsPath, 'LotwiseVRF.sol/LotwiseVRF.json')).abi;
            this.contracts.vrf = new ethers.Contract(
                this.contractAddresses.vrf,
                vrfAbi,
                this.signer || this.provider
            );

            // Price Feeds contract
            const priceFeedsAbi = require(path.join(artifactsPath, 'LotwisePriceFeeds.sol/LotwisePriceFeeds.json')).abi;
            this.contracts.priceFeeds = new ethers.Contract(
                this.contractAddresses.priceFeeds,
                priceFeedsAbi,
                this.signer || this.provider
            );

        } catch (error) {
            console.error('❌ Failed to load contracts:', error);
            throw error;
        }
    }

    // Core Contract Methods
    async createProperty(propertyData) {
        try {
            const tx = await this.contracts.core.createProperty(
                propertyData.propertyId,
                propertyData.address,
                propertyData.totalValue,
                propertyData.totalTokens,
                propertyData.tokenPrice,
                propertyData.metadata
            );
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                propertyId: propertyData.propertyId
            };
        } catch (error) {
            console.error('❌ Failed to create property:', error);
            throw error;
        }
    }

    async mintToken(propertyId, recipient, tokenId) {
        try {
            const tx = await this.contracts.core.mintToken(propertyId, recipient, tokenId);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                tokenId: tokenId,
                recipient: recipient
            };
        } catch (error) {
            console.error('❌ Failed to mint token:', error);
            throw error;
        }
    }

    async getProperty(propertyId) {
        try {
            const property = await this.contracts.core.getProperty(propertyId);
            return {
                propertyId: property.propertyId,
                address: property.address,
                totalValue: ethers.formatEther(property.totalValue),
                totalTokens: property.totalTokens.toString(),
                tokenPrice: ethers.formatEther(property.tokenPrice),
                mintedTokens: property.mintedTokens.toString(),
                metadata: property.metadata,
                owner: property.owner
            };
        } catch (error) {
            console.error('❌ Failed to get property:', error);
            throw error;
        }
    }

    async getTokenOwner(tokenId) {
        try {
            const owner = await this.contracts.core.ownerOf(tokenId);
            return owner;
        } catch (error) {
            console.error('❌ Failed to get token owner:', error);
            throw error;
        }
    }

    async getTokenURI(tokenId) {
        try {
            const uri = await this.contracts.core.tokenURI(tokenId);
            return uri;
        } catch (error) {
            console.error('❌ Failed to get token URI:', error);
            throw error;
        }
    }

    async getTotalSupply() {
        try {
            const totalSupply = await this.contracts.core.totalSupply();
            return totalSupply.toString();
        } catch (error) {
            console.error('❌ Failed to get total supply:', error);
            throw error;
        }
    }

    // Marketplace Contract Methods
    async listToken(tokenId, price) {
        try {
            const tx = await this.contracts.marketplace.listToken(tokenId, ethers.parseEther(price));
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                tokenId: tokenId,
                price: price
            };
        } catch (error) {
            console.error('❌ Failed to list token:', error);
            throw error;
        }
    }

    async buyToken(tokenId, price) {
        try {
            const tx = await this.contracts.marketplace.buyToken(tokenId, { value: ethers.parseEther(price) });
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                tokenId: tokenId,
                price: price
            };
        } catch (error) {
            console.error('❌ Failed to buy token:', error);
            throw error;
        }
    }

    async cancelListing(tokenId) {
        try {
            const tx = await this.contracts.marketplace.cancelListing(tokenId);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                tokenId: tokenId
            };
        } catch (error) {
            console.error('❌ Failed to cancel listing:', error);
            throw error;
        }
    }

    async getTokenListing(tokenId) {
        try {
            const listing = await this.contracts.marketplace.getTokenListing(tokenId);
            return {
                tokenId: listing.tokenId.toString(),
                price: ethers.formatEther(listing.price),
                seller: listing.seller,
                isActive: listing.isActive,
                listedAt: new Date(Number(listing.listedAt) * 1000).toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to get token listing:', error);
            throw error;
        }
    }

    async isTokenListed(tokenId) {
        try {
            const isListed = await this.contracts.marketplace.isTokenListed(tokenId);
            return isListed;
        } catch (error) {
            console.error('❌ Failed to check if token is listed:', error);
            throw error;
        }
    }

    // VRF Contract Methods
    async requestRandomValue(propertyId) {
        try {
            const tx = await this.contracts.vrf.requestRandomValue(propertyId);
            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                propertyId: propertyId
            };
        } catch (error) {
            console.error('❌ Failed to request random value:', error);
            throw error;
        }
    }

    async getVRFRequest(requestId) {
        try {
            const request = await this.contracts.vrf.getVRFRequest(requestId);
            return {
                requestId: request.requestId.toString(),
                propertyId: request.propertyId.toString(),
                timestamp: new Date(Number(request.timestamp) * 1000).toISOString(),
                fulfilled: request.fulfilled,
                randomValue: request.randomValue.toString()
            };
        } catch (error) {
            console.error('❌ Failed to get VRF request:', error);
            throw error;
        }
    }

    // Price Feeds Contract Methods
    async getEthUsdPrice() {
        try {
            const price = await this.contracts.priceFeeds.getEthUsdPrice();
            return ethers.formatUnits(price, 8);
        } catch (error) {
            console.error('❌ Failed to get ETH/USD price:', error);
            throw error;
        }
    }

    async getBtcUsdPrice() {
        try {
            const price = await this.contracts.priceFeeds.getBtcUsdPrice();
            return ethers.formatUnits(price, 8);
        } catch (error) {
            console.error('❌ Failed to get BTC/USD price:', error);
            throw error;
        }
    }

    async getAvaxUsdPrice() {
        try {
            const price = await this.contracts.priceFeeds.getAvaxUsdPrice();
            return ethers.formatUnits(price, 8);
        } catch (error) {
            console.error('❌ Failed to get AVAX/USD price:', error);
            throw error;
        }
    }

    async getAllPrices() {
        try {
            const prices = await this.contracts.priceFeeds.getAllPrices();
            return {
                ethUsd: ethers.formatUnits(prices.ethUsd, 8),
                btcUsd: ethers.formatUnits(prices.btcUsd, 8),
                avaxUsd: ethers.formatUnits(prices.avaxUsd, 8)
            };
        } catch (error) {
            console.error('❌ Failed to get all prices:', error);
            throw error;
        }
    }

    // Utility Methods
    async getContractAddresses() {
        return this.contractAddresses;
    }

    async getSignerAddress() {
        if (this.signer) {
            return await this.signer.getAddress();
        }
        return null;
    }

    async getBalance(address) {
        const balance = await this.provider.getBalance(address);
        return ethers.formatEther(balance);
    }
}

module.exports = ContractService; 