const axios = require('axios');

const public_key = process.env.DELIVERY_API_PUBLIC_KEY;
const secret_key = process.env.DELIVERY_API_SECRET_KEY;

const baseURL = process.env.DELIVERY_API_URL || 'https://backend-lelivreur.up.railway.app';

async function testAuth(headers, path, label) {
  try {
    const response = await axios.get(`${baseURL}${path}`, { headers });
    console.log(`SUCCESS [${label}] on [${path}]:`, response.status);
    console.log('Data sample:', JSON.stringify(response.data).substring(0, 100));
    return true;
  } catch (error) {
    const status = error.response ? error.response.status : error.message;
    console.log(`ISSUE [${label}] on [${path}]:`, status);
    if (error.response && error.response.data) {
        console.log('  Error data:', JSON.stringify(error.response.data));
    }
    return false;
  }
}

async function runTests() {
  if (!public_key || !secret_key) {
    console.error('Missing env vars: DELIVERY_API_PUBLIC_KEY and/or DELIVERY_API_SECRET_KEY');
    process.exit(1);
  }

  const paths = [
    '/livreurs',
    '/livraisons'
  ];
  
  for (const path of paths) {
    console.log(`\n--- Testing Path: ${path} ---`);
    await testAuth({ 'x-api-key': `${public_key}:${secret_key}` }, path, 'x-api-key: pub:sec');
    
    await testAuth({ 'x-api-key': secret_key }, path, 'x-api-key: sec');

    await testAuth({ 'Authorization': `ApiKey ${public_key}:${secret_key}` }, path, 'Auth: ApiKey pub:sec');
  }
}

runTests();
