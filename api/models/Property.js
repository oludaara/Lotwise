const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    address: String,
    totalValue: Number,
    tokenPrice: Number,
    totalTokens: Number,
    mintedTokens: Number,
    description: String,
    imageUrl: String,
    yearBuilt: Number,
    squareFeet: Number,
    propertyType: String,
    neighborhood: String,
    amenities: [String],
    coordinates: {
        lat: Number,
        lng: Number
    },
    verified: { type: Boolean, default: false },
    aaveStats: {
        totalSupplied: Number,
        totalBorrowed: Number,
        averageAPY: Number,
        totalYieldDistributed: Number
    },
    owners: [
        {
            address: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            tokens: Number,
            percentage: Number
        }
    ]
});

module.exports = mongoose.model('Property', propertySchema); 