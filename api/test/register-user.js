const axios = require('axios');
const { ethers } = require('ethers');

const BASE_URL = 'http://localhost:3001/api';
// Test private key (DO NOT use in production!)
const PRIVATE_KEY = '0x59c6995e998f97a5a0044976f7d4e20d3d1b6e0c7e3a7fd7c3c6c7e1e7e3c7e1';
const wallet = new ethers.Wallet(PRIVATE_KEY);
const address = wallet.address;

async function registerUser() {
    try {
        // 1. Get nonce
        const nonceResp = await axios.post(`${BASE_URL}/auth/nonce`, { address });
        const { message } = nonceResp.data;
        console.log('Nonce message to sign:', message);

        // 2. Sign message
        const signature = await wallet.signMessage(message);
        console.log('Signature:', signature);

        // 3. Verify
        const verifyResp = await axios.post(`${BASE_URL}/auth/verify`, { address, signature });
        console.log('User registered:', verifyResp.data);
    } catch (err) {
        if (err.response) {
            console.error('API Error:', err.response.status, err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
}

registerUser(); 