const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
    try {
        // 1. Auth: Get nonce and verify (simulate wallet address)
        const address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
        let nonceResp = await axios.post(`${BASE_URL}/auth/nonce`, { address });
        console.log('Auth Nonce:', nonceResp.data);
        // Simulate signature (skip actual signing for test)
        // Instead, call verify with a fake signature to show the flow
        let verifyResp;
        try {
            verifyResp = await axios.post(`${BASE_URL}/auth/verify`, { address, signature: '0xFAKESIGNATURE' });
        } catch (err) {
            // Expecting failure due to invalid signature, but this shows the endpoint is hit
            console.log('Auth Verify (expected fail):', err.response ? err.response.data : err.message);
        }

        // 2. Properties: List and get one
        let propsResp = await axios.get(`${BASE_URL}/properties?limit=2`);
        console.log('Properties List:', propsResp.data);
        if (propsResp.data.properties.length > 0) {
            let propId = propsResp.data.properties[0].id;
            let propDetail = await axios.get(`${BASE_URL}/properties/${propId}`);
            console.log('Property Detail:', propDetail.data);
        }

        // 3. Users: Portfolio (simulate address)
        let userPortfolio = await axios.get(`${BASE_URL}/users/${address}/portfolio`);
        console.log('User Portfolio:', userPortfolio.data);

        // 4. Marketplace: List and get
        let marketResp = await axios.get(`${BASE_URL}/marketplace?limit=2`);
        console.log('Marketplace Listings:', marketResp.data);

        // 5. Yield: Get for a property
        if (propsResp.data.properties.length > 0) {
            let propId = propsResp.data.properties[0].id;
            let yieldResp = await axios.get(`${BASE_URL}/yield/${propId}`);
            console.log('Yield for Property:', yieldResp.data);
        }

        // 6. Aave: Get position
        let aaveResp = await axios.get(`${BASE_URL}/aave/position/${address}`);
        console.log('Aave Position:', aaveResp.data);

        // 7. Liquidation: Risks
        let liqResp = await axios.get(`${BASE_URL}/liquidation/risks`);
        console.log('Liquidation Risks:', liqResp.data);

    } catch (err) {
        if (err.response) {
            console.error('API Error:', err.response.status, err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
}

runTests(); 