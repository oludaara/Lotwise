const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Database Connection Manager for Lotwise Platform
 */
class DatabaseConnection {
    static connection = null;
    static isConnected = false;

    /**
     * Connect to MongoDB database
     * @param {string} uri - MongoDB connection URI
     * @returns {Promise<void>}
     */
    static async connect(uri = null) {
        try {
            const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/lotwise';
            
            if (this.isConnected) {
                console.log('📘 Already connected to MongoDB');
                return;
            }

            console.log('🔗 Connecting to MongoDB:', mongoUri.replace(/\/\/.*@/, '//***:***@'));

            this.connection = await mongoose.connect(mongoUri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false
            });

            this.isConnected = true;
            console.log('✅ MongoDB connected successfully!');

            // Handle connection events
            mongoose.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.log('📤 MongoDB disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                console.log('🔄 MongoDB reconnected');
                this.isConnected = true;
            });

            // Graceful shutdown
            process.on('SIGINT', this.disconnect);
            process.on('SIGTERM', this.disconnect);

        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Disconnect from MongoDB database
     * @returns {Promise<void>}
     */
    static async disconnect() {
        try {
            if (this.connection) {
                await mongoose.connection.close();
                console.log('📤 MongoDB connection closed');
                this.isConnected = false;
                this.connection = null;
            }
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error);
        }
    }

    /**
     * Get connection status
     * @returns {boolean}
     */
    static getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
        };
    }

    /**
     * Check if database is healthy
     * @returns {Promise<boolean>}
     */
    static async healthCheck() {
        try {
            if (!this.isConnected) {
                return false;
            }

            // Try a simple operation
            await mongoose.connection.db.admin().ping();
            return true;
        } catch (error) {
            console.error('❌ Database health check failed:', error);
            return false;
        }
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>}
     */
    static async getStats() {
        try {
            if (!this.isConnected) {
                throw new Error('Database not connected');
            }

            const stats = await mongoose.connection.db.stats();
            const collections = await mongoose.connection.db.listCollections().toArray();
            
            return {
                database: mongoose.connection.name,
                collections: collections.length,
                dataSize: stats.dataSize,
                storageSize: stats.storageSize,
                indexSize: stats.indexSize,
                documents: stats.objects,
                indexes: stats.indexes,
                uptime: stats.uptime
            };
        } catch (error) {
            console.error('❌ Error getting database stats:', error);
            throw error;
        }
    }

    /**
     * Create database indexes for optimization
     * @returns {Promise<void>}
     */
    static async createIndexes() {
        try {
            console.log('📊 Creating database indexes...');

            const Property = require('../models/Property');
            const User = require('../models/User');
            const Marketplace = require('../models/Marketplace');
            const PriceHistory = require('../models/PriceHistory');

            // Property indexes
            await Property.collection.createIndex({ id: 1 }, { unique: true });
            await Property.collection.createIndex({ verified: 1 });
            await Property.collection.createIndex({ propertyType: 1 });
            await Property.collection.createIndex({ totalValue: 1 });

            // User indexes
            await User.collection.createIndex({ address: 1 }, { unique: true });
            await User.collection.createIndex({ totalTokens: 1 });
            await User.collection.createIndex({ portfolioValue: 1 });

            // Marketplace indexes
            await Marketplace.collection.createIndex({ active: 1 });
            await Marketplace.collection.createIndex({ price: 1 });
            await Marketplace.collection.createIndex({ seller: 1 });

            // Price history indexes
            await PriceHistory.collection.createIndex({ timestamp: 1 });

            console.log('✅ Database indexes created successfully');
        } catch (error) {
            console.error('❌ Error creating database indexes:', error);
            throw error;
        }
    }
}

module.exports = DatabaseConnection;
