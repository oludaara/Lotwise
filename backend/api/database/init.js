#!/usr/bin/env node

/**
 * Lotwise Database Initialization Script
 * Sets up the database with initial data and configuration
 */

const DatabaseConnection = require('./connection');
const DatabaseSeeder = require('./seeder');

class DatabaseInitializer {
    static async initialize(options = {}) {
        const {
            seed = true,
            createIndexes = true,
            force = false,
            environment = process.env.NODE_ENV || 'development'
        } = options;

        try {
            console.log('🚀 Initializing Lotwise Database...');
            console.log(`📍 Environment: ${environment}`);
            
            // Connect to database
            await DatabaseConnection.connect();
            
            // Check if database already has data
            const stats = await DatabaseSeeder.getStats();
            const hasData = Object.values(stats).some(count => count > 0);
            
            if (hasData && !force) {
                console.log('📊 Database already contains data:');
                console.log(`   - Properties: ${stats.properties}`);
                console.log(`   - Users: ${stats.users}`);
                console.log(`   - Marketplace: ${stats.marketplaceListings}`);
                console.log(`   - Price History: ${stats.priceHistoryRecords}`);
                console.log('');
                console.log('💡 Use --force flag to reset and reseed the database');
                
                if (!force) {
                    console.log('✅ Database initialization skipped (data exists)');
                    return;
                }
            }
            
            // Create indexes
            if (createIndexes) {
                await DatabaseConnection.createIndexes();
            }
            
            // Seed database
            if (seed) {
                await DatabaseSeeder.seedAll();
            }
            
            // Display final stats
            const finalStats = await DatabaseSeeder.getStats();
            console.log('');
            console.log('📊 Final Database Statistics:');
            console.log(`   - Properties: ${finalStats.properties}`);
            console.log(`   - Users: ${finalStats.users}`);
            console.log(`   - Marketplace: ${finalStats.marketplaceListings}`);
            console.log(`   - Price History: ${finalStats.priceHistoryRecords}`);
            
            // Database health check
            const isHealthy = await DatabaseConnection.healthCheck();
            console.log(`🏥 Database Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
            
            console.log('');
            console.log('🎉 Database initialization completed successfully!');
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            process.exit(1);
        }
    }

    static async reset() {
        try {
            console.log('🔄 Resetting database...');
            
            await DatabaseConnection.connect();
            await DatabaseSeeder.clearDatabase();
            
            console.log('✅ Database reset completed');
            
        } catch (error) {
            console.error('❌ Database reset failed:', error);
            process.exit(1);
        }
    }

    static async status() {
        try {
            console.log('📊 Database Status Report');
            console.log('========================');
            
            await DatabaseConnection.connect();
            
            // Connection status
            const connectionStatus = DatabaseConnection.getConnectionStatus();
            console.log('🔗 Connection Status:');
            console.log(`   - Connected: ${connectionStatus.isConnected ? '✅' : '❌'}`);
            console.log(`   - Host: ${connectionStatus.host || 'N/A'}`);
            console.log(`   - Port: ${connectionStatus.port || 'N/A'}`);
            console.log(`   - Database: ${connectionStatus.name || 'N/A'}`);
            console.log('');
            
            // Health check
            const isHealthy = await DatabaseConnection.healthCheck();
            console.log(`🏥 Health Status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
            console.log('');
            
            // Data statistics
            const dataStats = await DatabaseSeeder.getStats();
            console.log('📊 Data Statistics:');
            console.log(`   - Properties: ${dataStats.properties}`);
            console.log(`   - Users: ${dataStats.users}`);
            console.log(`   - Marketplace: ${dataStats.marketplaceListings}`);
            console.log(`   - Price History: ${dataStats.priceHistoryRecords}`);
            console.log('');
            
            // Database statistics
            const dbStats = await DatabaseConnection.getStats();
            console.log('💾 Database Statistics:');
            console.log(`   - Collections: ${dbStats.collections}`);
            console.log(`   - Documents: ${dbStats.documents}`);
            console.log(`   - Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   - Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   - Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
            
        } catch (error) {
            console.error('❌ Failed to get database status:', error);
            process.exit(1);
        }
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'init';
    
    const options = {
        force: args.includes('--force'),
        seed: !args.includes('--no-seed'),
        createIndexes: !args.includes('--no-indexes')
    };
    
    switch (command) {
        case 'init':
        case 'initialize':
            DatabaseInitializer.initialize(options)
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;
            
        case 'reset':
            DatabaseInitializer.reset()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;
            
        case 'status':
            DatabaseInitializer.status()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;
            
        default:
            console.log('Usage: node database/init.js [command] [options]');
            console.log('');
            console.log('Commands:');
            console.log('  init, initialize  Initialize database with seed data (default)');
            console.log('  reset            Clear all data from database');
            console.log('  status           Show database status and statistics');
            console.log('');
            console.log('Options:');
            console.log('  --force          Force reset even if data exists');
            console.log('  --no-seed        Skip seeding data');
            console.log('  --no-indexes     Skip creating indexes');
            process.exit(1);
    }
}

module.exports = DatabaseInitializer;
