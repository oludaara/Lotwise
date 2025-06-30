const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
    timestamp: String,
    ethPrice: Number,
    maticPrice: Number
});

module.exports = mongoose.model('PriceHistory', priceHistorySchema); 