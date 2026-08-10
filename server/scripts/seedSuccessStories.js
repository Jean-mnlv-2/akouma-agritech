/* eslint-disable no-console */
// Contenu générique/placeholder — à remplacer par de vraies histoires de
// bénéficiaires via Admin → Dons - Contenus (aucune personne ou lieu réel
// n'est inventé ici, tout est explicitement générique).
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const stories = [
  {
    slug: 'cooperative-maraichere-appuyee',
    title: 'Une coopérative maraîchère mieux outillée',
    description: "Grâce aux dons reçus, une coopérative maraîchère a pu s'équiper en matériel d'irrigation goutte-à-goutte et réduire sa consommation d'eau.",
    impact: "Rendement en hausse de 30% sur la saison suivante",
    year: '2025',
    imageUrl: '/placeholder.svg',
    order: 0,
    isActive: true,
  },
  {
    slug: 'formation-jeunes-agriculteurs',
    title: 'Des jeunes formés aux techniques agricoles modernes',
    description: "Un groupe de jeunes agriculteurs a suivi gratuitement les formations e-learning KILIMO grâce au soutien des donateurs.",
    impact: "45 jeunes certifiés en agriculture durable",
    year: '2025',
    imageUrl: '/placeholder.svg',
    order: 1,
    isActive: true,
  },
  {
    slug: 'semences-ameliorees-distribuees',
    title: 'Semences améliorées distribuées à des petits producteurs',
    description: "Un lot de semences certifiées a été distribué à des producteurs n'ayant pas accès à du matériel végétal de qualité.",
    impact: "120 familles bénéficiaires",
    year: '2024',
    imageUrl: '/placeholder.svg',
    order: 2,
    isActive: true,
  },
  {
    slug: 'capteurs-sol-parcelle-pilote',
    title: 'Une parcelle pilote équipée en capteurs connectés',
    description: "Une exploitation pilote a été équipée de capteurs d'humidité du sol financés par les dons, permettant un suivi précis de l'irrigation.",
    impact: "Économie d'eau estimée à 40%",
    year: '2025',
    imageUrl: '/placeholder.svg',
    order: 3,
    isActive: true,
  },
  {
    slug: 'accompagnement-cooperative-feminine',
    title: 'Accompagnement d\'une coopérative féminine',
    description: "Une coopérative portée par des femmes a bénéficié d'un accompagnement technique et d'un appui matériel pour développer son activité maraîchère.",
    impact: "Revenus doublés en une saison",
    year: '2024',
    imageUrl: '/placeholder.svg',
    order: 4,
    isActive: true,
  },
  {
    slug: 'reboisement-parcelle-communautaire',
    title: 'Reboisement d\'une parcelle communautaire',
    description: "Un projet de reboisement communautaire a été financé pour restaurer une parcelle dégradée et améliorer la fertilité des sols environnants.",
    impact: "3 hectares reboisés",
    year: '2025',
    imageUrl: '/placeholder.svg',
    order: 5,
    isActive: true,
  },
];

async function seedSuccessStories() {
  console.log(`📖 Création de ${stories.length} histoires de succès (contenu placeholder)...\n`);

  for (const data of stories) {
    const story = await prisma.successStory.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
    console.log(`✅ Histoire : ${story.title} (id=${story.id}, slug=${story.slug})`);
  }

  console.log(`\n🎉 ${stories.length} histoires créées — à remplacer par de vrais témoignages via l'admin.`);
}

seedSuccessStories()
  .catch((e) => {
    console.error('❌ Erreur lors du seed des histoires de succès :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
