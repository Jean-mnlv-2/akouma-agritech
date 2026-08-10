/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const events = [
  {
    slug: 'webinaire-irrigation-intelligente',
    title: "Webinaire : Irrigation intelligente et économie d'eau",
    description: "Une session en ligne pour découvrir comment piloter l'irrigation à partir de capteurs d'humidité du sol.",
    date: new Date('2026-09-10T15:00:00Z'),
    location: 'En ligne (Zoom)',
    imageUrl: '/placeholder.svg',
    isPublished: true,
  },
  {
    slug: 'journee-portes-ouvertes-semences',
    title: 'Journée portes ouvertes : semences certifiées',
    description: "Présentation des nouvelles variétés de semences disponibles en boutique, avec démonstrations sur parcelle.",
    date: new Date('2026-09-25T09:00:00Z'),
    location: 'Douala, Cameroun',
    imageUrl: '/placeholder.svg',
    isPublished: true,
  },
  {
    slug: 'formation-terrain-maraichage-biologique',
    title: 'Formation terrain : Maraîchage biologique',
    description: "Session pratique en petit groupe sur les techniques de maraîchage biologique, animée par nos agronomes.",
    date: new Date('2026-10-08T08:30:00Z'),
    location: 'Yaoundé, Cameroun',
    imageUrl: '/placeholder.svg',
    isPublished: true,
  },
  {
    slug: 'salon-agritech-afrique-centrale',
    title: "Salon Agritech d'Afrique Centrale",
    description: "KILIMO participe au salon régional dédié aux innovations technologiques pour l'agriculture.",
    date: new Date('2026-11-05T09:00:00Z'),
    location: 'Yaoundé, Cameroun',
    imageUrl: '/placeholder.svg',
    isPublished: true,
  },
  {
    slug: 'webinaire-financement-vert-ekolo',
    title: 'Webinaire : Financement vert et crédits carbone',
    description: "En partenariat avec Ekolo, une présentation des opportunités de financement pour les projets agricoles durables.",
    date: new Date('2026-11-20T15:00:00Z'),
    location: 'En ligne (Zoom)',
    imageUrl: '/placeholder.svg',
    isPublished: true,
  },
  {
    slug: 'ceremonie-remise-certificats',
    title: 'Cérémonie de remise des certificats KILIMO E-Learning',
    description: "Célébration des apprenants ayant validé leur parcours de formation au cours du semestre.",
    date: new Date('2026-12-12T14:00:00Z'),
    location: 'Douala, Cameroun',
    imageUrl: '/placeholder.svg',
    isPublished: true,
  },
];

async function seedEvents() {
  console.log(`📅 Création de ${events.length} événements...\n`);

  for (const data of events) {
    const event = await prisma.event.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
    console.log(`✅ Événement : ${event.title} (id=${event.id}, slug=${event.slug})`);
  }

  console.log(`\n🎉 ${events.length} événements créés avec succès.`);
}

seedEvents()
  .catch((e) => {
    console.error('❌ Erreur lors du seed des événements :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
