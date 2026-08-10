/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const products = [
  {
    slug: 'kit-capteurs-iot-sol',
    name: 'Kit de capteurs IoT sol',
    description: "Mesure en temps réel l'humidité, la température et le pH du sol.",
    price: 45000,
    stock: 40,
    category: 'IoT & Capteurs',
    imageUrl: '/placeholder.svg',
    isActive: true,
    isFeatured: true,
    isNew: false,
    isPublished: true,
    features: ['Humidité du sol', 'Température', 'pH', 'Transmission sans fil'],
    specifications: { portee: '200 m', autonomie: '12 mois', connectivite: 'LoRa / WiFi' },
  },
  {
    slug: 'systeme-irrigation-goutte-a-goutte',
    name: 'Système d\'irrigation goutte-à-goutte',
    description: "Kit complet pour irrigation localisée sur 500 m² de culture.",
    price: 85000,
    stock: 25,
    category: 'Irrigation',
    imageUrl: '/placeholder.svg',
    isActive: true,
    isFeatured: true,
    isNew: false,
    isPublished: true,
    features: ['Économie d\'eau jusqu\'à 60%', 'Programmable', 'Filtration intégrée'],
    specifications: { couverture: '500 m²', pression: '1-2 bar', materiau: 'PEBD résistant UV' },
  },
  {
    slug: 'station-meteo-connectee',
    name: 'Station météo connectée',
    description: "Suivi de la pluviométrie, du vent et de la température pour anticiper les traitements.",
    price: 120000,
    stock: 15,
    category: 'Météo',
    imageUrl: '/placeholder.svg',
    isActive: true,
    isFeatured: true,
    isNew: true,
    isPublished: true,
    features: ['Pluviométrie', 'Vitesse du vent', 'Alertes météo', 'Historique cloud'],
    specifications: { alimentation: 'Panneau solaire intégré', portee_transmission: '1 km' },
  },
  {
    slug: 'kit-demarrage-agriculture-precision',
    name: 'Kit de démarrage agriculture de précision',
    description: "Pack combiné capteurs + application mobile pour piloter une petite exploitation.",
    price: 150000,
    stock: 20,
    category: 'Kits complets',
    imageUrl: '/placeholder.svg',
    isActive: true,
    isFeatured: true,
    isNew: true,
    isPublished: true,
    features: ['3 capteurs sol', 'Application mobile incluse', 'Support technique 6 mois'],
    specifications: { capteurs_inclus: 3, garantie: '12 mois' },
  },
  {
    slug: 'pulverisateur-solaire-portable',
    name: 'Pulvérisateur solaire portable',
    description: "Pulvérisateur à dos rechargeable par panneau solaire, autonomie prolongée.",
    price: 38000,
    stock: 60,
    category: 'Équipement',
    imageUrl: '/placeholder.svg',
    isActive: true,
    isFeatured: false,
    isNew: false,
    isPublished: true,
    features: ['Rechargeable solaire', 'Réservoir 16L', 'Pression réglable'],
    specifications: { capacite: '16 L', autonomie: '4-5 heures d\'utilisation continue' },
  },
  {
    slug: 'capteur-humidite-sol-autonome',
    name: 'Capteur d\'humidité du sol autonome',
    description: "Capteur unitaire longue durée pour surveiller une parcelle spécifique.",
    price: 15000,
    stock: 100,
    category: 'IoT & Capteurs',
    imageUrl: '/placeholder.svg',
    isActive: true,
    isFeatured: false,
    isNew: false,
    isPublished: true,
    features: ['Installation simple', 'Batterie longue durée', 'Alertes seuil bas'],
    specifications: { autonomie_batterie: '18 mois', profondeur_mesure: '10-30 cm' },
  },
  {
    slug: 'panneau-solaire-portable-exploitation',
    name: 'Panneau solaire portable pour exploitation',
    description: "Panneau pliable 100W pour alimenter capteurs, pompes et petits équipements.",
    price: 65000,
    stock: 35,
    category: 'Énergie',
    imageUrl: '/placeholder.svg',
    isActive: true,
    isFeatured: false,
    isNew: true,
    isPublished: true,
    features: ['Pliable et portable', 'Sortie USB + 12V', 'Résistant aux intempéries'],
    specifications: { puissance: '100 W', poids: '4.2 kg' },
  },
  {
    slug: 'kit-test-sol-npk-ph',
    name: 'Kit de test de sol NPK + pH',
    description: "Analyse rapide sur le terrain de l'azote, phosphore, potassium et du pH.",
    price: 22000,
    stock: 80,
    category: 'Équipement',
    imageUrl: '/placeholder.svg',
    isActive: true,
    isFeatured: false,
    isNew: false,
    isPublished: true,
    features: ['Résultats en 10 minutes', 'Réutilisable', 'Sans électricité'],
    specifications: { tests_inclus: '100 mesures', parametres: 'N, P, K, pH' },
  },
];

async function seedShopProducts() {
  console.log(`🛒 Création de ${products.length} produits boutique...\n`);

  for (const data of products) {
    const product = await prisma.shopProduct.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
    console.log(`✅ Produit : ${product.name} (id=${product.id}, slug=${product.slug})`);
  }

  console.log(`\n🎉 ${products.length} produits boutique créés avec succès.`);
}

seedShopProducts()
  .catch((e) => {
    console.error('❌ Erreur lors du seed des produits boutique :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
