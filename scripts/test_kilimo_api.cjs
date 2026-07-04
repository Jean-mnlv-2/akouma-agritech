
const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:4000';
const INTERNAL_API_TOKEN = 'dev_jwt_secret_min_32_chars_for_docker_12345678941'; // Valeur actuelle dans le conteneur

// Test data
const testNews = {
  title: "Test: Nouvelle technique d'agriculture durable en Afrique",
  excerpt: "Un projet innovant utilise des techniques agroécologiques pour améliorer la productivité des petits agriculteurs.",
  content: `<p>Un nouveau projet lancé en Afrique de l'Ouest démontre que les techniques agroécologiques peuvent augmenter la productivité des petits agriculteurs de manière durable.</p>
<p>Le projet, soutenu par plusieurs partenaires internationaux, a déjà permis à des centaines de familles d'améliorer leurs revenus tout en préservant l'environnement.</p>`,
  author: "DeerFlow AI",
  category: "Agriculture",
  imageUrl: null,
  isPublished: false,
  isFeatured: false,
  isCopyProtected: false,
  keywords: ["agriculture", "durable", "afrique", "agroécologie"],
  language: "fr",
  sourceName: "Test Source",
  sourceUrl: "https://example.com/test-article",
  slug: "test-technique-agriculture-durable-afrique"
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPI() {
  console.log('='.repeat(80));
  console.log('TEST DE L\'API KILIMO');
  console.log('='.repeat(80));
  
  // 1. Test de la health endpoint
  console.log('\n1️⃣ Test de /health');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET'
    });
    console.log(`   Statut: ${result.statusCode}`);
    console.log(`   Réponse:`, result.data);
  } catch (err) {
    console.log(`   ❌ Erreur: ${err.message}`);
    console.log(`   ℹ️ Le serveur n'est probablement pas démarré.`);
    console.log(`   ℹ️ Pour démarrer le serveur: cd server && npm run dev`);
    return;
  }
  
  // 2. Test de l'API interne auto-news
  console.log('\n2️⃣ Test de POST /api/internal/auto-news');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/internal/auto-news',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERNAL_API_TOKEN}`
      }
    }, testNews);
    
    console.log(`   Statut: ${result.statusCode}`);
    console.log(`   Réponse:`, JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.log(`   ❌ Erreur: ${err.message}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST TERMINÉ');
  console.log('='.repeat(80));
}

testAPI();
