const mongoose = require('mongoose');

const marketplaceSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    tokenId: Number,
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    price: Number,
    seller: String,
    listedAt: String,
    active: Boolean
});

module.exports = mongoose.model('Marketplace', marketplaceSchema); 