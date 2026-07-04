const axios = require('axios');

const public_key = process.env.DELIVERY_API_PUBLIC_KEY;
const secret_key = process.env.DELIVERY_API_SECRET_KEY;

const apiClient = axios.create({
  baseURL: process.env.DELIVERY_API_URL || 'https://backend-lelivreur.up.railway.app',
});

async function testPath(path) {
  console.log(`Testing path: ${path}`);
  try {
    const response = await apiClient.get(path);
    console.log(`SUCCESS [${path}]:`, response.status);
    return true;
  } catch (error) {
    console.log(`FAILED [${path}]:`, error.response ? error.response.status : error.message);
    return false;
  }
}

async function runTests() {
  if (!public_key || !secret_key) {
    console.error('Missing env vars: DELIVERY_API_PUBLIC_KEY and/or DELIVERY_API_SECRET_KEY');
    process.exit(1);
  }

  apiClient.defaults.headers['x-api-key'] = `${public_key}:${secret_key}`;

  const paths = [
    '/api/v1/external/livreurs',
    '/api/v1/livreurs',
    '/livreurs',
    '/api/external/livreurs',
    '/api/livreurs'
  ];
  
  for (const path of paths) {
    await testPath(path);
  }
}

runTests();
