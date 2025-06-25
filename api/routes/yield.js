const express = require('express');
const router = express.Router();

module.exports = ({ Property }) => {
    // GET /api/yield/:propertyId
    router.get('/:propertyId', async (req, res) => {
        const { propertyId } = req.params;
        const property = await Property.findOne({ id: propertyId }).populate('owners.address');
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        res.json({
            propertyId: property.id,
            totalYieldPool: property.aaveStats.totalYieldDistributed,
            currentAPY: property.aaveStats.averageAPY,
            nextDistribution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            totalOwners: property.owners.length,
            averageYieldPerToken: property.aaveStats.totalYieldDistributed / property.mintedTokens,
            owners: property.owners // now populated with User docs
        });
    });

    // GET /api/yield/:propertyId/:address
    router.get('/:propertyId/:address', async (req, res) => {
        const { propertyId, address } = req.params;
        const property = await Property.findOne({ id: propertyId }).populate('owners.address');
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        const owner = property.owners.find(o => o.address && o.address._id && o.address._id.toString() === address.toLowerCase());
        if (!owner) {
            return res.status(404).json({ error: 'User is not an owner of this property' });
        }
        const claimableYield = Math.floor(owner.tokens * 2.5);
        res.json({
            propertyId: property.id,
            user: owner.address, // full User doc
            tokensOwned: owner.tokens,
            ownershipPercentage: owner.percentage,
            claimableYield: claimableYield,
            totalYieldEarned: claimableYield * 2,
            lastClaimed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    });

    // POST /api/yield/claim
    router.post('/claim', async (req, res) => {
        // This is a mock implementation; in a real app, update user and property models
        res.json({
            success: true,
            transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
            claimedAmount: 125.50,
            propertyId: req.body.propertyId,
            message: 'Yield claimed successfully'
        });
    });

    return router;
}; 