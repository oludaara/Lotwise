const mongoose = require('mongoose');

const marketplaceSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    tokenId: Number,
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    price: Number,
    seller: String,
    listedAt: String,
    active: Boolean,

    // Cross-chain support
    sourceChain: { type: Number, default: 11155111 }, // Default to Sepolia
    destinationChains: [{ type: Number }], // Supported destination chains
    crossChainEnabled: { type: Boolean, default: false },
    transferFee: { type: String, default: '0' }, // CCIP transfer fee
    estimatedTransferTime: { type: String, default: 'N/A' },

    // Transaction tracking
    soldAt: Date,
    buyer: String,
    transactionHash: String,
    transferId: String, // CCIP transfer ID if cross-chain

    // Additional metadata
    metadata: {
        ipfsHash: String,
        tokenURI: String,
        attributes: [{
            trait_type: String,
            value: String
        }]
    },

    // Status tracking
    status: {
        type: String,
        enum: ['active', 'sold', 'delisted', 'transferring'],
        default: 'active'
    },

    // Cross-chain transfer details
    crossChainTransfer: {
        transferId: String,
        fromChain: Number,
        toChain: Number,
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        initiatedAt: Date,
        completedAt: Date,
        fee: String,
        gasUsed: String,
        gasPrice: String
    }
}, {
    timestamps: true
});

// Indexes for better query performance
marketplaceSchema.index({ id: 1 }, { unique: true });
marketplaceSchema.index({ active: 1 });
marketplaceSchema.index({ seller: 1 });
marketplaceSchema.index({ sourceChain: 1 });
marketplaceSchema.index({ crossChainEnabled: 1 });
marketplaceSchema.index({ 'crossChainTransfer.status': 1 });
marketplaceSchema.index({ listedAt: -1 });
marketplaceSchema.index({ price: 1 });

// Virtual for cross-chain status
marketplaceSchema.virtual('isCrossChain').get(function () {
    return this.crossChainEnabled && this.destinationChains && this.destinationChains.length > 0;
});

// Method to check if listing supports specific chain
marketplaceSchema.methods.supportsChain = function (chainId) {
    return this.destinationChains && this.destinationChains.includes(chainId);
};

// Method to get transfer fee for specific chain
marketplaceSchema.methods.getTransferFee = function (destinationChain) {
    if (!this.crossChainEnabled) return '0';

    // Different fees for different chains
    const feeMap = {
        1: '0.001',      // Ethereum: 0.001 ETH
        137: '0.01',     // Polygon: 0.01 MATIC
        11155111: '0.0001', // Sepolia: 0.0001 ETH
        80001: '0.001',   // Mumbai: 0.001 MATIC
        43114: '0.001',   // Avalanche: 0.001 AVAX
        43113: '0.001'    // Fuji: 0.001 AVAX
    };

    return feeMap[destinationChain] || this.transferFee;
};

// Method to get estimated transfer time for specific chain
marketplaceSchema.methods.getTransferTime = function (destinationChain) {
    if (!this.crossChainEnabled) return 'N/A';

    // Different times for different chains
    const timeMap = {
        1: '5-10 minutes',      // Ethereum
        137: '2-5 minutes',     // Polygon
        11155111: '5-10 minutes', // Sepolia
        80001: '2-5 minutes',   // Mumbai
        43114: '5-10 minutes',   // Avalanche
        43113: '5-10 minutes'    // Fuji
    };

    return timeMap[destinationChain] || this.estimatedTransferTime;
};

module.exports = mongoose.model('Marketplace', marketplaceSchema); 