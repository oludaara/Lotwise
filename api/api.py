"""
Lotwise Mock Property API
Week 1: Basic property data endpoint for testing
Week 2: Integration with Chainlink Functions
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import time
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Mock property database
PROPERTIES = {
    "123": {
        "property_id": "123",
        "address": "123 Main Street, San Francisco, CA 94102",
        "valuation": 1000000,  # $1M in USD
        "ownership_verified": True,
        "property_type": "Single Family Home",
        "bedrooms": 3,
        "bathrooms": 2,
        "square_feet": 2000,
        "year_built": 2020,
        "last_updated": int(time.time()),
        "description": "Beautiful modern home in prime San Francisco location",
        "images": [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"
        ],
        "coordinates": {
            "latitude": 37.7749,
            "longitude": -122.4194
        },
        "market_data": {
            "price_per_sqft": 500,
            "neighborhood_avg": 1050000,
            "appreciation_1yr": 0.05,  # 5% appreciation
            "days_on_market": 0
        }
    }
}

@app.route('/')
def home():
    """API documentation endpoint"""
    return jsonify({
        "message": "Lotwise Property API v1.0",
        "description": "Mock real estate data for blockchain tokenization",
        "endpoints": {
            "GET /property/<id>": "Get complete property information",
            "GET /property/<id>/verify": "Verify property ownership and valuation", 
            "GET /property/<id>/valuation": "Get current property valuation",
            "POST /property/<id>/update": "Update property data (admin)",
            "GET /health": "Health check endpoint"
        },
        "example": {
            "property_id": "123",
            "url": "/property/123"
        }
    })

@app.route('/property/<property_id>')
def get_property(property_id):
    """
    Get complete property information
    Used by: Frontend to display property details
    """
    if property_id not in PROPERTIES:
        return jsonify({
            "error": "Property not found",
            "property_id": property_id,
            "available_properties": list(PROPERTIES.keys())
        }), 404
    
    property_data = PROPERTIES[property_id].copy()
    property_data["api_timestamp"] = int(time.time())
    
    return jsonify(property_data)

@app.route('/property/<property_id>/verify')
def verify_property(property_id):
    """
    Verify property ownership and basic data
    Used by: Chainlink Functions to validate before tokenization
    Returns: Minimal data needed for smart contract verification
    """
    if property_id not in PROPERTIES:
        return jsonify({
            "property_id": property_id,
            "ownership_verified": False,
            "valuation": 0,
            "error": "Property not found"
        }), 404
    
    property_data = PROPERTIES[property_id]
    
    # Return only essential verification data
    verification_data = {
        "property_id": property_id,
        "ownership_verified": property_data["ownership_verified"],
        "valuation": property_data["valuation"],
        "property_type": property_data["property_type"],
        "last_verified": int(time.time()),
        "api_version": "1.0"
    }
    
    return jsonify(verification_data)

@app.route('/property/<property_id>/valuation')
def get_valuation(property_id):
    """
    Get current property valuation with market fluctuation
    Used by: Chainlink Data Feeds for price updates
    """
    if property_id not in PROPERTIES:
        return jsonify({
            "error": "Property not found",
            "property_id": property_id
        }), 404
    
    property_data = PROPERTIES[property_id]
    base_value = property_data["valuation"]
    
    # Simulate market fluctuation (±2% for realistic demo)
    import random
    fluctuation = random.uniform(-0.02, 0.02)  # ±2%
    current_value = int(base_value * (1 + fluctuation))
    
    valuation_data = {
        "property_id": property_id,
        "current_valuation": current_value,
        "base_valuation": base_value,
        "change_amount": current_value - base_value,
        "change_percent": round(fluctuation * 100, 2),
        "market_conditions": "stable" if abs(fluctuation) < 0.01 else "volatile",
        "timestamp": int(time.time()),
        "data_source": "mock_mls"
    }
    
    return jsonify(valuation_data)

@app.route('/property/<property_id>/update', methods=['POST'])
def update_property(property_id):
    """
    Update property data (admin endpoint)
    Used by: Admin interface or testing
    """
    if property_id not in PROPERTIES:
        return jsonify({
            "error": "Property not found",
            "property_id": property_id
        }), 404
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Update allowed fields
        allowed_fields = ['valuation', 'ownership_verified', 'description']
        updated_fields = []
        
        for field in allowed_fields:
            if field in data:
                PROPERTIES[property_id][field] = data[field]
                updated_fields.append(field)
        
        # Update timestamp
        PROPERTIES[property_id]['last_updated'] = int(time.time())
        
        return jsonify({
            "message": "Property updated successfully",
            "property_id": property_id,
            "updated_fields": updated_fields,
            "timestamp": PROPERTIES[property_id]['last_updated']
        })
        
    except Exception as e:
        return jsonify({
            "error": "Failed to update property",
            "details": str(e)
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        "status": "healthy",
        "timestamp": int(time.time()),
        "version": "1.0.0",
        "properties_count": len(PROPERTIES),
        "uptime": "mock_uptime"
    })

@app.route('/debug/all')
def debug_all_properties():
    """Debug endpoint - shows all property data (development only)"""
    if app.debug:
        return jsonify({
            "debug": True,
            "all_properties": PROPERTIES,
            "count": len(PROPERTIES)
        })
    else:
        return jsonify({"error": "Debug endpoint disabled in production"}), 403

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "available_endpoints": [
            "/",
            "/property/<id>",
            "/property/<id>/verify", 
            "/property/<id>/valuation",
            "/health"
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "error": "Internal server error",
        "message": "Please try again later"
    }), 500

if __name__ == '__main__':
    # Configuration
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    PORT = int(os.getenv('FLASK_PORT', 5000))
    
    print(f"🏠 Lotwise Property API starting...")
    print(f"📍 Server: http://{HOST}:{PORT}")
    print(f"🔍 Debug mode: {DEBUG}")
    print(f"📊 Properties loaded: {len(PROPERTIES)}")
    print(f"🧪 Test endpoint: http://{HOST}:{PORT}/property/123")
    
    app.run(debug=DEBUG, host=HOST, port=PORT)
