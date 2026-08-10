/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const news = [
  {
    slug: 'lancement-plateforme-kilimo',
    title: 'KILIMO Agritech lance sa plateforme complète',
    excerpt: "Formations en ligne, semences certifiées et boutique d'équipements : découvrez la nouvelle plateforme KILIMO.",
    content:
      "KILIMO Agritech ouvre officiellement sa plateforme dédiée aux agriculteurs africains, combinant formations en ligne, vente de semences certifiées et équipements agricoles connectés. L'objectif : rendre accessibles les outils et les connaissances nécessaires à une agriculture plus productive et plus durable.",
    author: 'Équipe KILIMO',
    category: 'Annonce',
    imageUrl: '/placeholder.svg',
    isFeatured: true,
    isPublished: true,
  },
  {
    slug: 'irrigation-intelligente-reduit-consommation-eau',
    title: "L'irrigation intelligente peut réduire la consommation d'eau de 40%",
    excerpt: "Retour sur les résultats des premiers déploiements de systèmes d'irrigation pilotés par capteurs.",
    content:
      "Les premiers retours d'expérience sur les systèmes d'irrigation goutte-à-goutte pilotés par capteurs d'humidité montrent une réduction significative de la consommation d'eau, tout en maintenant voire en améliorant les rendements. Une piste sérieuse pour les zones à ressources hydriques limitées.",
    author: 'Équipe KILIMO',
    category: 'Innovation',
    imageUrl: '/placeholder.svg',
    isFeatured: true,
    isPublished: true,
  },
  {
    slug: 'nouvelles-semences-certifiees-disponibles',
    title: 'Huit nouvelles variétés de semences certifiées disponibles en boutique',
    excerpt: "Maïs, riz, tomate, niébé et plus : la boutique KILIMO s'enrichit de nouvelles variétés.",
    content:
      "La boutique KILIMO propose désormais huit nouvelles variétés de semences certifiées, sélectionnées pour leur adaptation aux conditions de culture en Afrique subsaharienne : cycle court, résistance à la sécheresse et bon rendement.",
    author: 'Équipe KILIMO',
    category: 'Produits',
    imageUrl: '/placeholder.svg',
    isFeatured: false,
    isPublished: true,
  },
  {
    slug: 'formation-maraichage-biologique-lancee',
    title: 'Nouvelle formation : Maraîchage biologique, les bases',
    excerpt: "Une formation e-learning pour apprendre les fondamentaux du maraîchage biologique.",
    content:
      "KILIMO E-Learning lance une nouvelle formation consacrée aux bases du maraîchage biologique : préparation du sol, compostage, rotation des cultures et lutte naturelle contre les nuisibles. Certificat à la clé pour les apprenants qui valident le parcours.",
    author: 'Équipe Formation KILIMO',
    category: 'E-Learning',
    imageUrl: '/placeholder.svg',
    isFeatured: false,
    isPublished: true,
  },
  {
    slug: 'partenariat-financement-vert-ekolo',
    title: 'KILIMO en partenariat avec Ekolo pour la finance verte',
    excerpt: "Un partenariat pour connecter nos utilisateurs aux crédits carbone et au financement de projets durables.",
    content:
      "KILIMO s'associe à Ekolo, plateforme de finance verte et de traçabilité, pour permettre à nos utilisateurs d'accéder aux crédits carbone, au financement de projets durables et à des outils de conformité environnementale.",
    author: 'Équipe KILIMO',
    category: 'Partenariat',
    imageUrl: '/placeholder.svg',
    isFeatured: true,
    isPublished: true,
  },
  {
    slug: 'conseils-preparation-saison-pluies',
    title: 'Cinq conseils pour préparer vos cultures avant la saison des pluies',
    excerpt: "Nos agronomes partagent leurs recommandations pour bien démarrer la saison.",
    content:
      "Préparation du sol, choix des variétés, calendrier de semis, gestion de l'eau et prévention des maladies : voici cinq recommandations pratiques de nos agronomes pour aborder la saison des pluies dans les meilleures conditions.",
    author: 'Dr. Aïssata Koné',
    category: 'Conseils',
    imageUrl: '/placeholder.svg',
    isFeatured: false,
    isPublished: true,
  },
  {
    slug: 'programme-dons-premiers-projets-finances',
    title: 'Le programme de dons KILIMO finance ses premiers projets',
    excerpt: "Irrigation autonome, outil d'annotation IA, diagnostic des maladies : trois projets à soutenir.",
    content:
      "Le nouveau module de dons KILIMO permet de soutenir directement des projets concrets : un système d'irrigation autonome, un outil d'annotation d'images pour l'IA agricole (GURA), et une application de diagnostic des maladies des plantes. Chaque don contribue directement à leur financement.",
    author: 'Équipe KILIMO',
    category: 'Annonce',
    imageUrl: '/placeholder.svg',
    isFeatured: false,
    isPublished: true,
  },
  {
    slug: 'assistant-ia-conseil-agricole',
    title: "Un assistant conversationnel IA pour répondre à vos questions agricoles",
    excerpt: "Disponible directement sur le site, notre assistant IA répond aux questions techniques des agriculteurs.",
    content:
      "KILIMO intègre un assistant conversationnel basé sur l'intelligence artificielle, capable de répondre aux questions techniques des agriculteurs : itinéraires culturaux, produits phytosanitaires, bonnes pratiques agronomiques. Un accompagnement disponible à tout moment.",
    author: 'Équipe KILIMO',
    category: 'Innovation',
    imageUrl: '/placeholder.svg',
    isFeatured: false,
    isPublished: true,
  },
];

async function seedNews() {
  console.log(`📰 Création de ${news.length} actualités...\n`);

  for (const data of news) {
    const item = await prisma.news.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
    console.log(`✅ Actualité : ${item.title} (id=${item.id}, slug=${item.slug})`);
  }

  console.log(`\n🎉 ${news.length} actualités créées avec succès.`);
}

seedNews()
  .catch((e) => {
    console.error('❌ Erreur lors du seed des actualités :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
