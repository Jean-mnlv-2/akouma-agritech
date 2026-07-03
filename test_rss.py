
import feedparser
import requests

# Liste des sources RSS de config.yaml
sources = [
    {"url": "https://www.investiraucameroun.com/component/obrss/fullrss", "name": "Investir au Cameroun"},
    {"url": "https://www.cirad.fr/rss/actualites-dr-afrique-centrale", "name": "CIRAD Afrique Centrale"},
    {"url": "https://www.cirad.fr/rss/actualites", "name": "CIRAD Actualites"},
    {"url": "https://www.cirad.fr/rss/presse", "name": "CIRAD Presse"},
    {"url": "https://www.afdb.org/en/news-and-events/rss", "name": "BAD Actualites"},
    {"url": "https://www.afdb.org/en/ext-pr-private-sector/en/rss.xml", "name": "BAD Secteur Prive"},
    {"url": "https://www.scidev.net/global/global_rss.xml", "name": "SciDev.Net Global"},
    {"url": "https://agritechdigest.com/feed/", "name": "Agritech Digest"},
    {"url": "https://agrifocusafrica.com/feed/", "name": "AgriFocus Africa"},
    {"url": "https://www.afriqueverte.org/index.cfm?rub=-9", "name": "Afrique Verte"},
    {"url": "https://fr.africanews.com/feed/rss?themes=business", "name": "Africanews Economie"},
    {"url": "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf", "name": "AllAfrica"},
    {"url": "https://news.un.org/feed/subscribe/fr/news/topic/food-and-agriculture/feed/rss.xml", "name": "ONU Alimentation & Agriculture"},
]

print("="*80)
print("TEST DES FLUX RSS")
print("="*80)

for source in sources:
    print(f"\n🔍 Test de : {source['name']}")
    print(f"   URL : {source['url']}")
    
    try:
        # Télécharger le flux
        response = requests.get(source['url'], timeout=10)
        response.raise_for_status()
        
        # Parser le flux
        feed = feedparser.parse(response.content)
        
        if feed.bozo:
            print(f"   ⚠️ Erreur de parsing : {feed.bozo_exception}")
        else:
            print(f"   ✅ Flux valide !")
            print(f"   📊 Nombre d'articles : {len(feed.entries)}")
            
            if feed.entries:
                # Afficher le dernier article
                latest = feed.entries[0]
                print(f"   📰 Dernier article :")
                print(f"      Titre : {latest.title[:100]}{'...' if len(latest.title) > 100 else ''}")
                print(f"      Date : {latest.get('published', 'N/A')}")
                print(f"      Lien : {latest.get('link', 'N/A')}")
                
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Erreur de requête : {e}")
    except Exception as e:
        print(f"   ❌ Erreur inattendue : {e}")

print("\n" + "="*80)
print("TEST TERMINÉ")
print("="*80)
