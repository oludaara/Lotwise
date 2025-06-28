const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    address: { type: String, required: true, unique: true },
    username: String,
    email: String,
    profileImage: String,
    walletConnected: { type: Boolean, default: false },
    lastConnection: Date,
    connectionCount: { type: Number, default: 0 },
    totalTokensOwned: { type: Number, default: 0 },
    totalValueUSD: { type: Number, default: 0 },
    healthFactor: { type: Number, default: 100 },
    aaveStats: {
        totalSupplied: { type: Number, default: 0 },
        totalBorrowed: { type: Number, default: 0 },
        averageAPY: { type: Number, default: 0 },
        totalYieldEarned: { type: Number, default: 0 }
    },
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema); 