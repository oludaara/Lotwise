const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: 'Invalid Ethereum address format'
        }
    },
    username: { type: String, sparse: true },
    email: { type: String, sparse: true },
    profileImage: String,
    walletConnected: { type: Boolean, default: false },
    lastConnection: Date,
    connectionCount: { type: Number, default: 0 },
    totalTokensOwned: { type: Number, default: 0 },
    totalValueUSD: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    portfolioValue: { type: Number, default: 0 },
    totalSuppliedToAave: { type: Number, default: 0 },
    totalBorrowedFromAave: { type: Number, default: 0 },
    healthFactor: { type: Number, default: 100 },
    aaveStats: {
        totalSupplied: { type: Number, default: 0 },
        totalBorrowed: { type: Number, default: 0 },
        averageAPY: { type: Number, default: 0 },
        totalYieldEarned: { type: Number, default: 0 }
    },
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],

    // Multi-chain wallet support
    connectedNetworks: [{
        type: Number,
        validate: {
            validator: function (v) {
                return [11155111, 80001, 43113, 1, 137, 43114].includes(v);
            },
            message: 'Unsupported network chain ID'
        }
    }],
    currentNetwork: {
        type: Number,
        default: 11155111,
        validate: {
            validator: function (v) {
                return [11155111, 80001, 43113, 1, 137, 43114].includes(v);
            },
            message: 'Unsupported network chain ID'
        }
    },

    // Multi-chain portfolio data
    networkBalances: {
        ethereum: { tokens: { type: Number, default: 0 }, value: { type: Number, default: 0 } },
        polygon: { tokens: { type: Number, default: 0 }, value: { type: Number, default: 0 } },
        avalanche: { tokens: { type: Number, default: 0 }, value: { type: Number, default: 0 } }
    },

    // CCIP transfer history
    ccipTransfers: [{
        transferId: String,
        fromChainId: Number,
        toChainId: Number,
        tokenIds: [Number],
        status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
        txHash: String,
        timestamp: { type: Date, default: Date.now }
    }],

    // Wallet session management
    activeSessions: [{
        sessionId: String,
        chainId: Number,
        connectedAt: Date,
        lastActivity: Date,
        userAgent: String
    }],

    // Additional fields for comprehensive user management
    isVerified: { type: Boolean, default: false },
    kycStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_required'],
        default: 'not_required'
    },

    // Activity tracking
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },

    // Preferences
    preferences: {
        notifications: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: false },
        currency: { type: String, default: 'USD' },
        preferredNetwork: { type: Number, default: 11155111 }
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ address: 1 }, { unique: true });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ totalTokens: 1 });
userSchema.index({ portfolioValue: 1 });

module.exports = mongoose.model('User', userSchema);