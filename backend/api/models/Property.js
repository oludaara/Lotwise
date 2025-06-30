const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    totalValue: { type: Number, required: true },
    tokenPrice: { type: Number, required: true },
    totalTokens: { type: Number, default: 1000 },
    mintedTokens: { type: Number, default: 0 },
    description: { type: String, required: true },
    imageUrl: String,
    yearBuilt: Number,
    squareFeet: Number,
    propertyType: {
        type: String,
        enum: ['Single-Family', 'Multi-Family', 'Condominium', 'Townhouse', 'Commercial', 'Land'],
        required: true
    },
    neighborhood: String,
    amenities: [String],
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    verified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationTimestamp: Date,
    verificationData: String,

    // Cross-chain support
    sourceChain: { type: Number, default: 11155111 }, // Default to Sepolia
    supportedChains: [{ type: Number }], // Chains where this property can be transferred
    crossChainEnabled: { type: Boolean, default: false },
    crossChainEnabledAt: Date,

    // Token distribution across chains
    tokenDistribution: {
        '11155111': { tokens: { type: Number, default: 0 }, owners: { type: Number, default: 0 } }, // Sepolia
        '137': { tokens: { type: Number, default: 0 }, owners: { type: Number, default: 0 } }, // Polygon
        '43114': { tokens: { type: Number, default: 0 }, owners: { type: Number, default: 0 } }, // Avalanche
        '80001': { tokens: { type: Number, default: 0 }, owners: { type: Number, default: 0 } }, // Mumbai
        '43113': { tokens: { type: Number, default: 0 }, owners: { type: Number, default: 0 } }  // Fuji
    },

    // Cross-chain transfer statistics
    crossChainStats: {
        totalTransfers: { type: Number, default: 0 },
        completedTransfers: { type: Number, default: 0 },
        failedTransfers: { type: Number, default: 0 },
        totalVolume: { type: Number, default: 0 },
        averageTransferTime: { type: String, default: '5.2 minutes' },
        successRate: { type: String, default: '98.5%' }
    },

    aaveStats: {
        totalSupplied: { type: Number, default: 0 },
        totalBorrowed: { type: Number, default: 0 },
        averageAPY: { type: Number, default: 0 },
        totalYieldDistributed: { type: Number, default: 0 }
    },

    // Ownership tracking
    owners: [{
        address: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        tokens: { type: Number, required: true },
        percentage: { type: Number, required: true },
        chain: { type: Number, default: 11155111 } // Chain where tokens are held
    }],

    // Additional metadata
    metadata: {
        ipfsHash: String,
        legalDocuments: [String],
        inspection: {
            date: Date,
            score: Number,
            report: String
        }
    },

    // Market data
    marketData: {
        currentMarketValue: Number,
        priceAppreciation: Number,
        rentalYield: Number,
        occupancyRate: Number
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'pending', 'inactive', 'sold'],
        default: 'pending'
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes
propertySchema.index({ id: 1 }, { unique: true });
propertySchema.index({ verified: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ totalValue: 1 });
propertySchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
propertySchema.index({ sourceChain: 1 });
propertySchema.index({ crossChainEnabled: 1 });
propertySchema.index({ 'crossChainStats.totalTransfers': -1 });

// Virtual for cross-chain status
propertySchema.virtual('isCrossChain').get(function () {
    return this.crossChainEnabled && this.supportedChains && this.supportedChains.length > 0;
});

// Virtual for total cross-chain tokens
propertySchema.virtual('totalCrossChainTokens').get(function () {
    if (!this.tokenDistribution) return 0;
    return Object.values(this.tokenDistribution).reduce((sum, chain) => sum + (chain.tokens || 0), 0);
});

// Method to check if property supports specific chain
propertySchema.methods.supportsChain = function (chainId) {
    return this.supportedChains && this.supportedChains.includes(chainId);
};

// Method to get token count on specific chain
propertySchema.methods.getTokensOnChain = function (chainId) {
    if (!this.tokenDistribution || !this.tokenDistribution[chainId]) return 0;
    return this.tokenDistribution[chainId].tokens || 0;
};

// Method to get owner count on specific chain
propertySchema.methods.getOwnersOnChain = function (chainId) {
    if (!this.tokenDistribution || !this.tokenDistribution[chainId]) return 0;
    return this.tokenDistribution[chainId].owners || 0;
};

// Method to update cross-chain statistics
propertySchema.methods.updateCrossChainStats = function (transferData) {
    if (!this.crossChainStats) {
        this.crossChainStats = {
            totalTransfers: 0,
            completedTransfers: 0,
            failedTransfers: 0,
            totalVolume: 0,
            averageTransferTime: '5.2 minutes',
            successRate: '98.5%'
        };
    }

    this.crossChainStats.totalTransfers += 1;

    if (transferData.status === 'completed') {
        this.crossChainStats.completedTransfers += 1;
        this.crossChainStats.totalVolume += parseFloat(transferData.fee || 0);
    } else if (transferData.status === 'failed') {
        this.crossChainStats.failedTransfers += 1;
    }

    // Update success rate
    const total = this.crossChainStats.completedTransfers + this.crossChainStats.failedTransfers;
    if (total > 0) {
        this.crossChainStats.successRate = ((this.crossChainStats.completedTransfers / total) * 100).toFixed(1) + '%';
    }
};

// Method to enable cross-chain transfers
propertySchema.methods.enableCrossChain = function (supportedChains) {
    this.crossChainEnabled = true;
    this.supportedChains = supportedChains || [11155111, 137, 43114, 80001, 43113];
    this.crossChainEnabledAt = new Date();

    // Initialize token distribution if not exists
    if (!this.tokenDistribution) {
        this.tokenDistribution = {
            '11155111': { tokens: 0, owners: 0 },
            '137': { tokens: 0, owners: 0 },
            '43114': { tokens: 0, owners: 0 },
            '80001': { tokens: 0, owners: 0 },
            '43113': { tokens: 0, owners: 0 }
        };
    }

    // Initialize cross-chain stats if not exists
    if (!this.crossChainStats) {
        this.crossChainStats = {
            totalTransfers: 0,
            completedTransfers: 0,
            failedTransfers: 0,
            totalVolume: 0,
            averageTransferTime: '5.2 minutes',
            successRate: '98.5%'
        };
    }
};

// Method to get cross-chain summary
propertySchema.methods.getCrossChainSummary = function () {
    return {
        propertyId: this.id,
        address: this.address,
        crossChainEnabled: this.crossChainEnabled,
        supportedChains: this.supportedChains || [],
        tokenDistribution: this.tokenDistribution || {},
        crossChainStats: this.crossChainStats || {},
        totalCrossChainTokens: this.totalCrossChainTokens
    };
};

module.exports = mongoose.model('Property', propertySchema); 