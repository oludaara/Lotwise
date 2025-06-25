const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    address: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^0x[a-fA-F0-9]{40}$/.test(v);
            },
            message: 'Invalid Ethereum address format'
        }
    },
    totalTokens: { type: Number, default: 0 },
    portfolioValue: { type: Number, default: 0 },
    totalSuppliedToAave: { type: Number, default: 0 },
    totalBorrowedFromAave: { type: Number, default: 0 },
    healthFactor: { type: Number, default: 100 },
    claimableYield: { type: Number, default: 0 },
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    
    // Additional fields for comprehensive user management
    email: { type: String, sparse: true },
    username: { type: String, sparse: true },
    isVerified: { type: Boolean, default: false },
    kycStatus: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'not_required'], 
        default: 'not_required' 
    },
    
    // Activity tracking
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    
    // Preferences
    preferences: {
        notifications: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: false },
        currency: { type: String, default: 'USD' }
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