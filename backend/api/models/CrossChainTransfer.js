const mongoose = require('mongoose');

const crossChainTransferSchema = new mongoose.Schema({
    transferId: { type: String, required: true, unique: true },
    messageId: { type: String, required: true },

    // Token and property information
    tokenId: { type: Number, required: true },
    tokenCount: { type: Number, default: 1 },
    propertyId: { type: String },

    // Chain information
    fromChain: { type: Number, required: true },
    toChain: { type: Number, required: true },

    // User information
    from: { type: String, required: true },
    to: { type: String, required: true },

    // Transfer details
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },

    // Financial information
    fee: { type: String, required: true },
    gasUsed: { type: String },
    gasPrice: { type: String },
    totalCost: { type: String },

    // Timestamps
    initiatedAt: { type: Date, required: true },
    estimatedCompletion: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },

    // Transaction information
    transactionHash: { type: String },
    blockNumber: { type: Number },

    // CCIP specific information
    ccipData: {
        routerAddress: { type: String },
        chainSelector: { type: String },
        extraArgs: { type: String },
        feeToken: { type: String, default: '0x0000000000000000000000000000000000000000' } // Native token
    },

    // Error information
    error: {
        code: { type: String },
        message: { type: String },
        details: { type: String }
    },

    // Additional metadata
    metadata: {
        ipfsHash: String,
        tokenURI: String,
        propertyAddress: String,
        propertyValue: String
    },

    // Retry information
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    lastRetryAt: { type: Date },

    // User preferences
    userPreferences: {
        priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
        autoRetry: { type: Boolean, default: true },
        notifications: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Indexes for better query performance
crossChainTransferSchema.index({ transferId: 1 }, { unique: true });
crossChainTransferSchema.index({ messageId: 1 });
crossChainTransferSchema.index({ status: 1 });
crossChainTransferSchema.index({ fromChain: 1 });
crossChainTransferSchema.index({ toChain: 1 });
crossChainTransferSchema.index({ from: 1 });
crossChainTransferSchema.index({ to: 1 });
crossChainTransferSchema.index({ initiatedAt: -1 });
crossChainTransferSchema.index({ propertyId: 1 });
crossChainTransferSchema.index({ tokenId: 1 });

// Virtual for transfer duration
crossChainTransferSchema.virtual('duration').get(function () {
    if (!this.completedAt || !this.initiatedAt) return null;
    return this.completedAt.getTime() - this.initiatedAt.getTime();
});

// Virtual for is overdue
crossChainTransferSchema.virtual('isOverdue').get(function () {
    if (this.status !== 'pending' || !this.estimatedCompletion) return false;
    return new Date() > this.estimatedCompletion;
});

// Virtual for can retry
crossChainTransferSchema.virtual('canRetry').get(function () {
    return this.status === 'failed' && this.retryCount < this.maxRetries;
});

// Method to mark as completed
crossChainTransferSchema.methods.markCompleted = function (blockNumber, gasUsed, gasPrice) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.blockNumber = blockNumber;
    this.gasUsed = gasUsed;
    this.gasPrice = gasPrice;

    if (gasUsed && gasPrice) {
        this.totalCost = (BigInt(gasUsed) * BigInt(gasPrice)).toString();
    }
};

// Method to mark as failed
crossChainTransferSchema.methods.markFailed = function (errorCode, errorMessage, errorDetails) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.error = {
        code: errorCode,
        message: errorMessage,
        details: errorDetails
    };
};

// Method to retry transfer
crossChainTransferSchema.methods.retry = function () {
    if (!this.canRetry) {
        throw new Error('Transfer cannot be retried');
    }

    this.status = 'pending';
    this.retryCount += 1;
    this.lastRetryAt = new Date();
    this.estimatedCompletion = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    this.error = null;
};

// Method to get transfer summary
crossChainTransferSchema.methods.getSummary = function () {
    return {
        transferId: this.transferId,
        status: this.status,
        fromChain: this.fromChain,
        toChain: this.toChain,
        from: this.from,
        to: this.to,
        tokenId: this.tokenId,
        propertyId: this.propertyId,
        fee: this.fee,
        initiatedAt: this.initiatedAt,
        completedAt: this.completedAt,
        duration: this.duration,
        isOverdue: this.isOverdue
    };
};

// Static method to get transfer statistics
crossChainTransferSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalTransfers: { $sum: 1 },
                completedTransfers: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                failedTransfers: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                pendingTransfers: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                totalVolume: { $sum: { $toDouble: '$fee' } }
            }
        }
    ]);

    const result = stats[0] || {
        totalTransfers: 0,
        completedTransfers: 0,
        failedTransfers: 0,
        pendingTransfers: 0,
        totalVolume: 0
    };

    result.successRate = result.totalTransfers > 0
        ? ((result.completedTransfers / result.totalTransfers) * 100).toFixed(2)
        : 0;

    return result;
};

// Static method to get chain statistics
crossChainTransferSchema.statics.getChainStats = async function () {
    return await this.aggregate([
        {
            $group: {
                _id: '$toChain',
                transfers: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                volume: { $sum: { $toDouble: '$fee' } }
            }
        },
        {
            $project: {
                chainId: '$_id',
                transfers: 1,
                completed: 1,
                failed: 1,
                volume: 1,
                successRate: {
                    $cond: [
                        { $gt: ['$transfers', 0] },
                        { $multiply: [{ $divide: ['$completed', '$transfers'] }, 100] },
                        0
                    ]
                }
            }
        },
        { $sort: { transfers: -1 } }
    ]);
};

module.exports = mongoose.model('CrossChainTransfer', crossChainTransferSchema); 