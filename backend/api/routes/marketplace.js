const express = require('express');
const router = express.Router();

module.exports = ({ Marketplace }) => {
    // GET /api/marketplace
    router.get('/', async (req, res) => {
        const { property, minPrice, maxPrice, chain, crossChain, limit = 20, offset = 0 } = req.query;
        let query = { active: true };

        if (property) query.property = property;
        if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
        if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
        if (chain) query.sourceChain = parseInt(chain);
        if (crossChain === 'true') query.crossChainEnabled = true;

        const listings = await Marketplace.find(query)
            .populate('property')
            .skip(Number(offset))
            .limit(Number(limit));
        const total = await Marketplace.countDocuments(query);

        res.json({
            listings,
            total,
            limit: Number(limit),
            offset: Number(offset),
            filters: {
                property,
                minPrice,
                maxPrice,
                chain,
                crossChain
            }
        });
    });

    // POST /api/marketplace/list
    router.post('/list', async (req, res) => {
        const { tokenId, price, seller, property, sourceChain, destinationChains, crossChainEnabled = false } = req.body;

        if (!tokenId || !price || !seller || !property) {
            return res.status(400).json({
                error: 'Missing required parameters: tokenId, price, seller, property'
            });
        }

        const last = await Marketplace.findOne({}, {}, { sort: { id: -1 } });
        const newId = last ? last.id + 1 : 1;

        const newListing = await Marketplace.create({
            id: newId,
            tokenId,
            property,
            price,
            seller,
            sourceChain: sourceChain || 11155111, // Default to Sepolia
            destinationChains: destinationChains || [11155111, 137, 43114], // Default chains
            crossChainEnabled: crossChainEnabled,
            listedAt: new Date().toISOString(),
            active: true,
            transferFee: crossChainEnabled ? '0.001' : '0', // CCIP fee if cross-chain enabled
            estimatedTransferTime: crossChainEnabled ? '5-10 minutes' : 'N/A'
        });

        res.json({
            success: true,
            listing: newListing,
            message: crossChainEnabled ? 'Cross-chain listing created successfully' : 'Token listed successfully',
            crossChainInfo: crossChainEnabled ? {
                supportedChains: destinationChains || [11155111, 137, 43114],
                transferFee: '0.001',
                estimatedTime: '5-10 minutes'
            } : null
        });
    });

    // POST /api/marketplace/buy
    router.post('/buy', async (req, res) => {
        const { listingId, buyer, destinationChain } = req.body;

        const listing = await Marketplace.findOne({ id: listingId });
        if (!listing || !listing.active) {
            return res.status(404).json({ error: 'Listing not found or not active' });
        }

        if (listing.seller === buyer) {
            return res.status(400).json({ error: 'Cannot buy own listing' });
        }

        // Generate transaction details
        const transactionHash = '0x' + Math.random().toString(16).substr(2, 64);
        const transferId = listing.crossChainEnabled && destinationChain && destinationChain !== listing.sourceChain
            ? '0x' + Math.random().toString(16).substr(2, 64)
            : null;

        // Update listing status
        listing.active = false;
        listing.soldAt = new Date().toISOString();
        listing.buyer = buyer;
        listing.transactionHash = transactionHash;
        listing.transferId = transferId;
        await listing.save();

        const response = {
            success: true,
            transactionHash: transactionHash,
            tokenId: listing.tokenId,
            price: listing.price,
            seller: listing.seller,
            buyer: buyer,
            message: 'Token purchased successfully'
        };

        // Add cross-chain transfer info if applicable
        if (listing.crossChainEnabled && destinationChain && destinationChain !== listing.sourceChain) {
            response.crossChainTransfer = {
                transferId: transferId,
                fromChain: listing.sourceChain,
                toChain: parseInt(destinationChain),
                status: 'pending',
                estimatedTime: '5-10 minutes',
                fee: listing.transferFee
            };
        }

        res.json(response);
    });

    // GET /api/marketplace/crosschain
    router.get('/crosschain', async (req, res) => {
        const { sourceChain, destinationChain, limit = 20, offset = 0 } = req.query;

        let query = { active: true, crossChainEnabled: true };
        if (sourceChain) query.sourceChain = parseInt(sourceChain);
        if (destinationChain) query.destinationChains = parseInt(destinationChain);

        const listings = await Marketplace.find(query)
            .populate('property')
            .skip(Number(offset))
            .limit(Number(limit));
        const total = await Marketplace.countDocuments(query);

        res.json({
            success: true,
            listings,
            total,
            limit: Number(limit),
            offset: Number(offset),
            crossChainStats: {
                totalCrossChainListings: total,
                supportedChains: [11155111, 137, 43114, 80001, 43113],
                averageTransferTime: '5.2 minutes',
                averageTransferFee: '0.001'
            }
        });
    });

    // GET /api/marketplace/stats
    router.get('/stats', async (req, res) => {
        const totalListings = await Marketplace.countDocuments({ active: true });
        const crossChainListings = await Marketplace.countDocuments({ active: true, crossChainEnabled: true });
        const totalSold = await Marketplace.countDocuments({ active: false });

        // Calculate total volume
        const soldListings = await Marketplace.find({ active: false });
        const totalVolume = soldListings.reduce((sum, listing) => sum + parseFloat(listing.price || 0), 0);

        // Chain distribution
        const chainStats = await Marketplace.aggregate([
            { $match: { active: true } },
            { $group: { _id: '$sourceChain', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalListings,
                crossChainListings,
                totalSold,
                totalVolume: totalVolume.toFixed(2),
                crossChainPercentage: totalListings > 0 ? (crossChainListings / totalListings * 100).toFixed(2) : 0
            },
            chainDistribution: chainStats,
            crossChainFeatures: {
                supportedChains: [11155111, 137, 43114, 80001, 43113],
                averageTransferTime: '5.2 minutes',
                averageTransferFee: '0.001',
                successRate: '98.5%'
            }
        });
    });

    // DELETE /api/marketplace/list/:listingId
    router.delete('/list/:listingId', async (req, res) => {
        const { listingId } = req.params;
        const { seller } = req.body;

        const listing = await Marketplace.findOne({ id: listingId });
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (listing.seller !== seller) {
            return res.status(403).json({ error: 'Not authorized to delist this token' });
        }

        listing.active = false;
        listing.delistedAt = new Date().toISOString();
        await listing.save();

        res.json({
            success: true,
            message: 'Listing delisted successfully',
            listingId: listingId
        });
    });

    // GET /api/marketplace/user/:address
    router.get('/user/:address', async (req, res) => {
        const { address } = req.params;
        const { active = true, limit = 20, offset = 0 } = req.query;

        let query = { seller: address };
        if (active !== 'all') {
            query.active = active === 'true';
        }

        const listings = await Marketplace.find(query)
            .populate('property')
            .skip(Number(offset))
            .limit(Number(limit));
        const total = await Marketplace.countDocuments(query);

        res.json({
            success: true,
            address: address,
            listings,
            total,
            limit: Number(limit),
            offset: Number(offset),
            summary: {
                activeListings: await Marketplace.countDocuments({ seller: address, active: true }),
                soldListings: await Marketplace.countDocuments({ seller: address, active: false }),
                crossChainListings: await Marketplace.countDocuments({ seller: address, active: true, crossChainEnabled: true })
            }
        });
    });

    return router;
}; 