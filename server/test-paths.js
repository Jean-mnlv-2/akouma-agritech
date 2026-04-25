const axios = require('axios');
const { env } = require('./dist/utils/env');

const public_key = "pk_live_aje7_f17682d611cfcf6e4c913f5777db42ca91861dc361ccebd77f2cb23907b792cb";
const secret_key = "sk_live_aje7_6450b3a886ba2072e8c7a00ef454c7fb9034b77049f0ebc606";

const apiClient = axios.create({
  baseURL: 'https://backend-lelivreur.up.railway.app',
  headers: {
    'x-api-key': `${public_key}:${secret_key}`,
  },
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
