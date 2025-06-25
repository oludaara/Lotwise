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
    
    // Financial data
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
        percentage: { type: Number, required: true }
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

module.exports = mongoose.model('Property', propertySchema); 