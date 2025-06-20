/**
 * Simple API Tests for Lotwise Property API
 * Run: node test.js (while server is running)
 * Or: npm test (with Jest - TODO: implement)
 */

const baseUrl = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing Lotwise Property API...\n');
  
  const tests = [
    {
      name: 'Root endpoint',
      url: '/',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Property data (ID: 123)',
      url: '/property/123',
      method: 'GET',
      expectedStatus: 200,
      validate: (data) => data.property_id === '123' && data.valuation > 0
    },
    {
      name: 'Property verification',
      url: '/property/123/verify',
      method: 'GET',
      expectedStatus: 200,
      validate: (data) => data.ownership_verified === true
    },
    {
      name: 'Property valuation',
      url: '/property/123/valuation',
      method: 'GET',
      expectedStatus: 200,
      validate: (data) => data.current_valuation > 0 && data.base_valuation > 0
    },
    {
      name: 'Health check',
      url: '/health',
      method: 'GET',
      expectedStatus: 200,
      validate: (data) => data.status === 'healthy'
    },
    {
      name: 'Non-existent property',
      url: '/property/999',
      method: 'GET',
      expectedStatus: 404
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await fetch(`${baseUrl}${test.url}`, {
        method: test.method
      });
      
      const data = await response.json();
      
      // Check status code
      if (response.status !== test.expectedStatus) {
        console.log(`❌ ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`);
        failed++;
        continue;
      }
      
      // Run custom validation if provided
      if (test.validate && !test.validate(data)) {
        console.log(`❌ ${test.name}: Validation failed`);
        console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        failed++;
        continue;
      }
      
      console.log(`✅ ${test.name}: PASSED`);
      passed++;
      
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the API server.');
    process.exit(1);
  }
}

// Test property update (POST request)
async function testPropertyUpdate() {
  console.log('\n🔄 Testing property update...');
  
  try {
    const updateData = {
      valuation: 1100000,
      description: 'Updated via automated test'
    };
    
    const response = await fetch(`${baseUrl}/property/123/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    if (response.status === 200 && data.updated_fields && data.updated_fields.length > 0) {
      console.log('✅ Property update: PASSED');
      console.log(`   Updated fields: ${data.updated_fields.join(', ')}`);
    } else {
      console.log('❌ Property update: FAILED');
      console.log('   Response:', data);
    }
    
  } catch (error) {
    console.log(`❌ Property update: Error - ${error.message}`);
  }
}

// Run tests
if (require.main === module) {
  testAPI().then(() => {
    return testPropertyUpdate();
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { testAPI, testPropertyUpdate };
