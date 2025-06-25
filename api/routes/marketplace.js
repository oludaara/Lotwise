const express = require('express');
const router = express.Router();

module.exports = ({ Marketplace }) => {
    // GET /api/marketplace
    router.get('/', async (req, res) => {
        const { property, minPrice, maxPrice, limit = 20, offset = 0 } = req.query;
        let query = { active: true };
        if (property) query.property = property;
        if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
        if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
        const listings = await Marketplace.find(query)
            .populate('property')
            .skip(Number(offset))
            .limit(Number(limit));
        const total = await Marketplace.countDocuments(query);
        res.json({
            listings,
            total,
            limit: Number(limit),
            offset: Number(offset)
        });
    });

    // POST /api/marketplace/list
    router.post('/list', async (req, res) => {
        const { tokenId, price, seller, property } = req.body;
        const last = await Marketplace.findOne({}, {}, { sort: { id: -1 } });
        const newId = last ? last.id + 1 : 1;
        const newListing = await Marketplace.create({
            id: newId,
            tokenId,
            property,
            price,
            seller,
            listedAt: new Date().toISOString(),
            active: true
        });
        res.json({
            success: true,
            listing: newListing,
            message: 'Token listed successfully'
        });
    });

    // POST /api/marketplace/buy
    router.post('/buy', async (req, res) => {
        const { listingId, buyer } = req.body;
        const listing = await Marketplace.findOne({ id: listingId });
        if (!listing || !listing.active) {
            return res.status(404).json({ error: 'Listing not found or not active' });
        }
        listing.active = false;
        await listing.save();
        res.json({
            success: true,
            transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
            tokenId: listing.tokenId,
            price: listing.price,
            seller: listing.seller,
            buyer: buyer,
            message: 'Token purchased successfully'
        });
    });

    return router;
}; 