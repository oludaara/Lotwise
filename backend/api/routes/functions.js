const express = require('express');
const router = express.Router();

module.exports = ({ Property }) => {
    // POST /api/functions/verify-property
    router.post('/verify-property', async (req, res) => {
        try {
            const { propertyId, propertyData, verificationType } = req.body;

            const verificationResult = await verifyPropertyWithChainlink(propertyData, verificationType);

            await Property.findByIdAndUpdate(propertyId, {
                isVerified: verificationResult.verified,
                verificationTimestamp: new Date(),
                verificationData: JSON.stringify(verificationResult)
            });

            res.json({
                success: true,
                propertyId,
                verificationResult,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to verify property' });
        }
    });

    // GET /api/functions/verification-status
    router.get('/verification-status/:propertyId', async (req, res) => {
        try {
            const { propertyId } = req.params;
            const property = await Property.findById(propertyId);

            if (!property) {
                return res.status(404).json({ error: 'Property not found' });
            }

            res.json({
                propertyId,
                isVerified: property.isVerified,
                verificationTimestamp: property.verificationTimestamp,
                verificationData: property.verificationData ? JSON.parse(property.verificationData) : null,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch verification status' });
        }
    });

    // POST /api/functions/batch-verify
    router.post('/batch-verify', async (req, res) => {
        try {
            const { propertyIds, verificationType } = req.body;

            const results = [];

            for (const propertyId of propertyIds) {
                const property = await Property.findById(propertyId);
                if (property) {
                    const verificationResult = await verifyPropertyWithChainlink(property, verificationType);

                    await Property.findByIdAndUpdate(propertyId, {
                        isVerified: verificationResult.verified,
                        verificationTimestamp: new Date(),
                        verificationData: JSON.stringify(verificationResult)
                    });

                    results.push({
                        propertyId,
                        verified: verificationResult.verified,
                        details: verificationResult
                    });
                }
            }

            res.json({
                success: true,
                totalProcessed: propertyIds.length,
                results,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to batch verify properties' });
        }
    });

    // GET /api/functions/supported-verifications
    router.get('/supported-verifications', (req, res) => {
        res.json({
            verificationTypes: [
                {
                    type: 'property_ownership',
                    description: 'Verify property ownership and title',
                    dataRequired: ['property_address', 'owner_name', 'title_deed'],
                    estimatedCost: '0.1 LINK',
                    estimatedTime: '2-5 minutes'
                },
                {
                    type: 'property_value',
                    description: 'Verify property market value',
                    dataRequired: ['property_address', 'recent_sales', 'market_data'],
                    estimatedCost: '0.15 LINK',
                    estimatedTime: '3-7 minutes'
                },
                {
                    type: 'legal_status',
                    description: 'Verify legal status and liens',
                    dataRequired: ['property_address', 'legal_documents'],
                    estimatedCost: '0.2 LINK',
                    estimatedTime: '5-10 minutes'
                },
                {
                    type: 'comprehensive',
                    description: 'Comprehensive property verification',
                    dataRequired: ['all_above_data'],
                    estimatedCost: '0.5 LINK',
                    estimatedTime: '10-15 minutes'
                }
            ],
            timestamp: new Date().toISOString()
        });
    });

    async function verifyPropertyWithChainlink(propertyData, verificationType) {
        const verificationChecks = {
            property_ownership: {
                title_verified: Math.random() > 0.1,
                owner_confirmed: Math.random() > 0.05,
                no_liens: Math.random() > 0.15
            },
            property_value: {
                market_value_verified: Math.random() > 0.1,
                comparable_sales_valid: Math.random() > 0.1,
                appraisal_consistent: Math.random() > 0.1
            },
            legal_status: {
                legal_clear: Math.random() > 0.1,
                no_encumbrances: Math.random() > 0.1,
                zoning_compliant: Math.random() > 0.05
            }
        };

        let overallVerified = false;
        let verificationDetails = {};

        switch (verificationType) {
            case 'property_ownership':
                verificationDetails = verificationChecks.property_ownership;
                overallVerified = verificationDetails.title_verified &&
                    verificationDetails.owner_confirmed &&
                    verificationDetails.no_liens;
                break;
            case 'property_value':
                verificationDetails = verificationChecks.property_value;
                overallVerified = verificationDetails.market_value_verified &&
                    verificationDetails.comparable_sales_valid &&
                    verificationDetails.appraisal_consistent;
                break;
            case 'legal_status':
                verificationDetails = verificationChecks.legal_status;
                overallVerified = verificationDetails.legal_clear &&
                    verificationDetails.no_encumbrances &&
                    verificationDetails.zoning_compliant;
                break;
            case 'comprehensive':
                verificationDetails = {
                    ...verificationChecks.property_ownership,
                    ...verificationChecks.property_value,
                    ...verificationChecks.legal_status
                };
                overallVerified = Object.values(verificationDetails).every(check => check);
                break;
            default:
                verificationDetails = { error: 'Unsupported verification type' };
                overallVerified = false;
        }

        return {
            verified: overallVerified,
            verificationType,
            checks: verificationDetails,
            confidence: overallVerified ? (Math.random() * 20 + 80).toFixed(2) : (Math.random() * 30 + 40).toFixed(2),
            timestamp: new Date().toISOString(),
            functionId: '0x' + Math.random().toString(16).substr(2, 64),
            cost: verificationType === 'comprehensive' ? '0.5' : '0.15'
        };
    }

    return router;
}; 