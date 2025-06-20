/**
 * Lotwise Property API - Node.js/Express Version
 * Week 1: Basic property data endpoint for testing
 * Week 2: Integration with Chainlink Functions
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock property database
const PROPERTIES = {
  "123": {
    property_id: "123",
    address: "123 Main Street, San Francisco, CA 94102",
    valuation: 1000000,  // $1M in USD
    ownership_verified: true,
    property_type: "Single Family Home",
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 2000,
    year_built: 2020,
    last_updated: Math.floor(Date.now() / 1000),
    description: "Beautiful modern home in prime San Francisco location",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"
    ],
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    market_data: {
      price_per_sqft: 500,
      neighborhood_avg: 1050000,
      appreciation_1yr: 0.05,  // 5% appreciation
      days_on_market: 0
    }
  }
};

// Utility function to generate realistic market fluctuation
const generateMarketFluctuation = () => {
  return Math.random() * 0.04 - 0.02; // ±2% for realistic demo
};

// Routes

/**
 * @route   GET /
 * @desc    API documentation endpoint
 * @access  Public
 */
app.get('/', (req, res) => {
  res.json({
    message: "Lotwise Property API v1.0 (Node.js)",
    description: "Mock real estate data for blockchain tokenization",
    endpoints: {
      "GET /property/:id": "Get complete property information",
      "GET /property/:id/verify": "Verify property ownership and valuation", 
      "GET /property/:id/valuation": "Get current property valuation",
      "POST /property/:id/update": "Update property data (admin)",
      "GET /health": "Health check endpoint"
    },
    example: {
      property_id: "123",
      url: "/property/123"
    },
    tech_stack: "Node.js + Express",
    version: "1.0.0"
  });
});

/**
 * @route   GET /property/:id
 * @desc    Get complete property information
 * @access  Public
 * @usage   Frontend to display property details
 */
app.get('/property/:id', (req, res) => {
  const propertyId = req.params.id;
  
  if (!PROPERTIES[propertyId]) {
    return res.status(404).json({
      error: "Property not found",
      property_id: propertyId,
      available_properties: Object.keys(PROPERTIES)
    });
  }
  
  const propertyData = { ...PROPERTIES[propertyId] };
  propertyData.api_timestamp = Math.floor(Date.now() / 1000);
  
  res.json(propertyData);
});

/**
 * @route   GET /property/:id/verify
 * @desc    Verify property ownership and basic data
 * @access  Public
 * @usage   Chainlink Functions to validate before tokenization
 */
app.get('/property/:id/verify', (req, res) => {
  const propertyId = req.params.id;
  
  if (!PROPERTIES[propertyId]) {
    return res.status(404).json({
      property_id: propertyId,
      ownership_verified: false,
      valuation: 0,
      error: "Property not found"
    });
  }
  
  const propertyData = PROPERTIES[propertyId];
  
  // Return only essential verification data
  const verificationData = {
    property_id: propertyId,
    ownership_verified: propertyData.ownership_verified,
    valuation: propertyData.valuation,
    property_type: propertyData.property_type,
    last_verified: Math.floor(Date.now() / 1000),
    api_version: "1.0"
  };
  
  res.json(verificationData);
});

/**
 * @route   GET /property/:id/valuation
 * @desc    Get current property valuation with market fluctuation
 * @access  Public
 * @usage   Chainlink Data Feeds for price updates
 */
app.get('/property/:id/valuation', (req, res) => {
  const propertyId = req.params.id;
  
  if (!PROPERTIES[propertyId]) {
    return res.status(404).json({
      error: "Property not found",
      property_id: propertyId
    });
  }
  
  const propertyData = PROPERTIES[propertyId];
  const baseValue = propertyData.valuation;
  
  // Simulate market fluctuation
  const fluctuation = generateMarketFluctuation();
  const currentValue = Math.floor(baseValue * (1 + fluctuation));
  
  const valuationData = {
    property_id: propertyId,
    current_valuation: currentValue,
    base_valuation: baseValue,
    change_amount: currentValue - baseValue,
    change_percent: Math.round(fluctuation * 100 * 100) / 100, // Round to 2 decimals
    market_conditions: Math.abs(fluctuation) < 0.01 ? "stable" : "volatile",
    timestamp: Math.floor(Date.now() / 1000),
    data_source: "mock_mls"
  };
  
  res.json(valuationData);
});

/**
 * @route   POST /property/:id/update
 * @desc    Update property data (admin endpoint)
 * @access  Admin
 * @usage   Admin interface or testing
 */
app.post('/property/:id/update', (req, res) => {
  const propertyId = req.params.id;
  
  if (!PROPERTIES[propertyId]) {
    return res.status(404).json({
      error: "Property not found",
      property_id: propertyId
    });
  }
  
  try {
    const updateData = req.body;
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No update data provided"
      });
    }
    
    // Update allowed fields
    const allowedFields = ['valuation', 'ownership_verified', 'description'];
    const updatedFields = [];
    
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        PROPERTIES[propertyId][field] = updateData[field];
        updatedFields.push(field);
      }
    });
    
    // Update timestamp
    PROPERTIES[propertyId].last_updated = Math.floor(Date.now() / 1000);
    
    res.json({
      message: "Property updated successfully",
      property_id: propertyId,
      updated_fields: updatedFields,
      timestamp: PROPERTIES[propertyId].last_updated
    });
    
  } catch (error) {
    res.status(500).json({
      error: "Failed to update property",
      details: error.message
    });
  }
});

/**
 * @route   GET /health
 * @desc    Health check endpoint for monitoring
 * @access  Public
 */
app.get('/health', (req, res) => {
  res.json({
    status: "healthy",
    timestamp: Math.floor(Date.now() / 1000),
    version: "1.0.0",
    tech_stack: "Node.js + Express",
    properties_count: Object.keys(PROPERTIES).length,
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route   GET /debug/all
 * @desc    Debug endpoint - shows all property data (development only)
 * @access  Development
 */
app.get('/debug/all', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: "Debug endpoint disabled in production"
    });
  }
  
  res.json({
    debug: true,
    all_properties: PROPERTIES,
    count: Object.keys(PROPERTIES).length,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handlers

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    requested_url: req.originalUrl,
    method: req.method,
    available_endpoints: [
      "GET /",
      "GET /property/:id",
      "GET /property/:id/verify", 
      "GET /property/:id/valuation",
      "POST /property/:id/update",
      "GET /health"
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? error.message : "Please try again later",
    timestamp: Math.floor(Date.now() / 1000)
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`🏠 Lotwise Property API (Node.js) starting...`);
  console.log(`📍 Server: http://${HOST}:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Properties loaded: ${Object.keys(PROPERTIES).length}`);
  console.log(`🧪 Test endpoint: http://${HOST}:${PORT}/property/123`);
  console.log(`💚 Health check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

module.exports = app;
