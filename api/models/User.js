const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    address: { type: String, required: true, unique: true },
    totalTokens: { type: Number, default: 0 },
    portfolioValue: { type: Number, default: 0 },
    totalSuppliedToAave: { type: Number, default: 0 },
    totalBorrowedFromAave: { type: Number, default: 0 },
    healthFactor: { type: Number, default: 100 },
    claimableYield: { type: Number, default: 0 },
    properties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema); 