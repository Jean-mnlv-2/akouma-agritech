
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Liste des sources RSS
const sources = [
  { url: 'https://www.investiraucameroun.com/component/obrss/fullrss', name: 'Investir au Cameroun' },
  { url: 'https://www.cirad.fr/rss/actualites-dr-afrique-centrale', name: 'CIRAD Afrique Centrale' },
  { url: 'https://www.cirad.fr/rss/actualites', name: 'CIRAD Actualites' },
  { url: 'https://www.cirad.fr/rss/presse', name: 'CIRAD Presse' },
  { url: 'https://www.afdb.org/en/news-and-events/rss', name: 'BAD Actualites' },
  { url: 'https://www.afdb.org/en/ext-pr-private-sector/en/rss.xml', name: 'BAD Secteur Prive' },
  { url: 'https://www.scidev.net/global/global_rss.xml', name: 'SciDev.Net Global' },
  { url: 'https://agritechdigest.com/feed/', name: 'Agritech Digest' },
  { url: 'https://agrifocusafrica.com/feed/', name: 'AgriFocus Africa' },
  { url: 'https://www.afriqueverte.org/index.cfm?rub=-9', name: 'Afrique Verte' },
  { url: 'https://fr.africanews.com/feed/rss?themes=business', name: 'Africanews Economie' },
  { url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf', name: 'AllAfrica' },
  { url: 'https://news.un.org/feed/subscribe/fr/news/topic/food-and-agriculture/feed/rss.xml', name: 'ONU Alimentation & Agriculture' },
];

function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(url, { timeout: 10000 }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data, statusCode: res.statusCode });
        } else {
          reject(new Error(`Statut HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout de la requête'));
    });
  });
}

async function testAllSources() {
  console.log('='.repeat(80));
  console.log('TEST DES FLUX RSS');
  console.log('='.repeat(80));

  for (const source of sources) {
    console.log(`\n🔍 Test de : ${source.name}`);
    console.log(`   URL : ${source.url}`);

    try {
      const result = await fetchRSS(source.url);
      console.log(`   ✅ Flux accessible ! (Code ${result.statusCode})`);
      console.log(`   📊 Taille du flux : ${result.data.length} octets`);

      // Compter le nombre d'articles (simple détection)
      const articleCount = (result.data.match(/<item>/gi) || []).length;
      const entryCount = (result.data.match(/<entry>/gi) || []).length;
      console.log(`   📚 Nombre d'articles détectés : ${articleCount || entryCount || '?'}`);

    } catch (error) {
      console.log(`   ❌ Erreur : ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('TEST TERMINÉ');
  console.log('='.repeat(80));
}

testAllSources();
