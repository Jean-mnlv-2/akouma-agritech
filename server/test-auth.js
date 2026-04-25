const axios = require('axios');

const public_key = "pk_live_aje7_f52496ed6010b5fc4f58426c1b9888988e7e158891788411744e9aa490ac5b68";
const secret_key = "sk_live_aje7_600b8ca4e5adfa6da08016af2fa0c7b9e15f933f3346bf2d5e";

const baseURL = 'https://backend-lelivreur.up.railway.app';

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
  const paths = [
    '/livreurs',
    '/livraisons'
  ];
  
  for (const path of paths) {
    console.log(`\n--- Testing Path: ${path} ---`);
    await testAuth({ 'x-api-key': `${public_key}:${secret_key}` }, path, 'x-api-key: pub:sec');
    
    // Test avec uniquement la secret key (souvent le cas pour les appels serveur)
    await testAuth({ 'x-api-key': secret_key }, path, 'x-api-key: sec');

    // Test avec le header Authorization (alternative citée dans la doc)
    await testAuth({ 'Authorization': `ApiKey ${public_key}:${secret_key}` }, path, 'Auth: ApiKey pub:sec');
  }
}

runTests();
