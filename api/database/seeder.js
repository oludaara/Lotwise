const mongoose = require('mongoose');
const Property = require('../models/Property');
const User = require('../models/User');
const Marketplace = require('../models/Marketplace');
const PriceHistory = require('../models/PriceHistory');

/**
 * Database Seeder for Lotwise Platform
 * Seeds the database with initial test data for development
 */
class DatabaseSeeder {
    static async seedAll() {
        try {
            console.log('🌱 Starting database seeding...');
            
            // Clear existing data
            await this.clearDatabase();
            
            // Seed in order due to relationships
            await this.seedProperties();
            await this.seedUsers();
            await this.seedMarketplace();
            await this.seedPriceHistory();
            
            console.log('✅ Database seeding completed successfully!');
        } catch (error) {
            console.error('❌ Database seeding failed:', error);
            throw error;
        }
    }

    static async clearDatabase() {
        console.log('🧹 Clearing existing data...');
        await Property.deleteMany({});
        await User.deleteMany({});
        await Marketplace.deleteMany({});
        await PriceHistory.deleteMany({});
        console.log('✅ Database cleared');
    }

    static async seedProperties() {
        console.log('🏠 Seeding properties...');
        
        const properties = [
            {
                id: "PROP-001",
                address: "123 Main St, San Francisco, CA",
                totalValue: 1000000,
                tokenPrice: 1000,
                totalTokens: 1000,
                mintedTokens: 450,
                description: "Luxury downtown apartment building with premium amenities",
                imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
                yearBuilt: 2018,
                squareFeet: 50000,
                propertyType: "Multi-Family",
                neighborhood: "SOMA",
                amenities: ["Gym", "Rooftop Deck", "Parking Garage", "24/7 Concierge", "Pool"],
                coordinates: { lat: 37.7749, lng: -122.4194 },
                verified: true,
                aaveStats: {
                    totalSupplied: 150000,
                    totalBorrowed: 100000,
                    averageAPY: 5.2,
                    totalYieldDistributed: 7500
                }
            },
            {
                id: "PROP-002",
                address: "456 Ocean Ave, Los Angeles, CA",
                totalValue: 2500000,
                tokenPrice: 2500,
                totalTokens: 1000,
                mintedTokens: 750,
                description: "Beachfront luxury condominiums with ocean views",
                imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
                yearBuilt: 2020,
                squareFeet: 75000,
                propertyType: "Condominium",
                neighborhood: "Santa Monica",
                amenities: ["Beach Access", "Infinity Pool", "Spa", "Valet Parking", "Wine Cellar"],
                coordinates: { lat: 34.0522, lng: -118.2437 },
                verified: true,
                aaveStats: {
                    totalSupplied: 500000,
                    totalBorrowed: 350000,
                    averageAPY: 4.8,
                    totalYieldDistributed: 24000
                }
            },
            {
                id: "PROP-003",
                address: "789 Park Ave, New York, NY",
                totalValue: 5000000,
                tokenPrice: 5000,
                totalTokens: 1000,
                mintedTokens: 600,
                description: "Historic brownstone in prestigious Upper East Side",
                imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
                yearBuilt: 1925,
                squareFeet: 85000,
                propertyType: "Townhouse",
                neighborhood: "Upper East Side",
                amenities: ["Historic Architecture", "Private Garden", "Elevator", "Fireplace"],
                coordinates: { lat: 40.7831, lng: -73.9712 },
                verified: true,
                aaveStats: {
                    totalSupplied: 800000,
                    totalBorrowed: 600000,
                    averageAPY: 4.5,
                    totalYieldDistributed: 45000
                }
            }
        ];

        const createdProperties = await Property.insertMany(properties);
        console.log(`✅ Created ${createdProperties.length} properties`);
        return createdProperties;
    }

    static async seedUsers() {
        console.log('👥 Seeding users...');
        
        const properties = await Property.find({});
        
        const users = [
            {
                address: "0x1234567890abcdef1234567890abcdef12345678",
                totalTokens: 75,
                portfolioValue: 175000,
                totalSuppliedToAave: 50000,
                totalBorrowedFromAave: 30000,
                healthFactor: 85,
                claimableYield: 1250,
                properties: [properties[0]._id, properties[1]._id]
            },
            {
                address: "0x742d35cc6664c4532123c75f51c69c6cbc12345a",
                totalTokens: 25,
                portfolioValue: 75000,
                totalSuppliedToAave: 15000,
                totalBorrowedFromAave: 10000,
                healthFactor: 92,
                claimableYield: 450,
                properties: [properties[0]._id]
            },
            {
                address: "0xabcdef1234567890abcdef1234567890abcdef12",
                totalTokens: 150,
                portfolioValue: 425000,
                totalSuppliedToAave: 100000,
                totalBorrowedFromAave: 60000,
                healthFactor: 78,
                claimableYield: 2100,
                properties: [properties[0]._id, properties[1]._id, properties[2]._id]
            },
            {
                address: "0x9876543210fedcba9876543210fedcba98765432",
                totalTokens: 200,
                portfolioValue: 1200000,
                totalSuppliedToAave: 300000,
                totalBorrowedFromAave: 200000,
                healthFactor: 95,
                claimableYield: 5500,
                properties: [properties[2]._id]
            }
        ];

        const createdUsers = await User.insertMany(users);
        
        // Update properties with owner references
        await Property.findByIdAndUpdate(properties[0]._id, {
            owners: [
                { address: createdUsers[0]._id, tokens: 50, percentage: 5.0 },
                { address: createdUsers[1]._id, tokens: 100, percentage: 10.0 },
                { address: createdUsers[2]._id, tokens: 300, percentage: 30.0 }
            ]
        });
        
        await Property.findByIdAndUpdate(properties[1]._id, {
            owners: [
                { address: createdUsers[0]._id, tokens: 200, percentage: 20.0 },
                { address: createdUsers[2]._id, tokens: 150, percentage: 15.0 }
            ]
        });
        
        await Property.findByIdAndUpdate(properties[2]._id, {
            owners: [
                { address: createdUsers[2]._id, tokens: 300, percentage: 30.0 },
                { address: createdUsers[3]._id, tokens: 200, percentage: 20.0 }
            ]
        });

        console.log(`✅ Created ${createdUsers.length} users`);
        return createdUsers;
    }

    static async seedMarketplace() {
        console.log('🏪 Seeding marketplace...');
        
        const properties = await Property.find({});
        
        const listings = [
            {
                id: 1,
                tokenId: 123,
                property: properties[0]._id,
                price: 1050,
                seller: "0x1234567890abcdef1234567890abcdef12345678",
                listedAt: new Date("2024-01-15T10:30:00Z").toISOString(),
                active: true
            },
            {
                id: 2,
                tokenId: 456,
                property: properties[1]._id,
                price: 2600,
                seller: "0x742d35cc6664c4532123c75f51c69c6cbc12345a",
                listedAt: new Date("2024-01-16T14:20:00Z").toISOString(),
                active: true
            },
            {
                id: 3,
                tokenId: 789,
                property: properties[2]._id,
                price: 5200,
                seller: "0xabcdef1234567890abcdef1234567890abcdef12",
                listedAt: new Date("2024-01-17T09:45:00Z").toISOString(),
                active: true
            }
        ];

        const createdListings = await Marketplace.insertMany(listings);
        console.log(`✅ Created ${createdListings.length} marketplace listings`);
        return createdListings;
    }

    static async seedPriceHistory() {
        console.log('📈 Seeding price history...');
        
        const startDate = new Date('2024-01-01');
        const endDate = new Date();
        const priceHistory = [];
        
        let currentDate = new Date(startDate);
        let ethPrice = 2000;
        let maticPrice = 0.8;
        
        while (currentDate <= endDate) {
            // Simulate price fluctuations
            ethPrice += (Math.random() - 0.5) * 100;
            maticPrice += (Math.random() - 0.5) * 0.1;
            
            // Keep prices in reasonable ranges
            ethPrice = Math.max(1500, Math.min(4000, ethPrice));
            maticPrice = Math.max(0.5, Math.min(2.0, maticPrice));
            
            priceHistory.push({
                timestamp: currentDate.toISOString().split('T')[0],
                ethPrice: Math.round(ethPrice * 100) / 100,
                maticPrice: Math.round(maticPrice * 1000) / 1000
            });
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const createdPriceHistory = await PriceHistory.insertMany(priceHistory);
        console.log(`✅ Created ${createdPriceHistory.length} price history records`);
        return createdPriceHistory;
    }

    static async getStats() {
        const propertyCount = await Property.countDocuments();
        const userCount = await User.countDocuments();
        const marketplaceCount = await Marketplace.countDocuments();
        const priceHistoryCount = await PriceHistory.countDocuments();
        
        return {
            properties: propertyCount,
            users: userCount,
            marketplaceListings: marketplaceCount,
            priceHistoryRecords: priceHistoryCount
        };
    }
}

module.exports = DatabaseSeeder;
