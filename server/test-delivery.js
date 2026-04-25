const { getLivreurs } = require('./dist/services/deliveryService');

async function testDeliveryApi() {
  console.log('--- TEST DELIVERY API ---');
  try {
    // On simule l'environnement nécessaire si besoin, mais ici on teste juste la connectivité
    const livreurs = await getLivreurs({ page: 1, limit: 5 });
    console.log('SUCCESS: Retrieved livreurs:', JSON.stringify(livreurs, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('FAILED: Delivery API error:', error.message);
    process.exit(1);
  }
}

testDeliveryApi();
