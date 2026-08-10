/* eslint-disable no-console */
// Contenu générique/placeholder — à remplacer par vos vrais partenaires
// via Admin → Partenaires (aucun nom d'organisation réelle n'est inventé ici).
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const partners = [
  {
    slug: 'cooperative-agricole-partenaire',
    name: 'Coopérative Agricole Partenaire',
    type: 'Coopérative',
    description: "Coopérative regroupant des producteurs locaux, partenaire pour la distribution de semences certifiées.",
    year: '2024',
    logo: '🌾',
    imageUrl: '/placeholder.svg',
    order: 0,
    isActive: true,
  },
  {
    slug: 'institut-recherche-agronomique',
    name: "Institut de Recherche Agronomique",
    type: 'Recherche',
    description: "Partenaire scientifique pour le développement de variétés adaptées et le contenu des formations.",
    year: '2024',
    logo: '🔬',
    imageUrl: '/placeholder.svg',
    order: 1,
    isActive: true,
  },
  {
    slug: 'fournisseur-equipements-agritech',
    name: 'Fournisseur d\'Équipements Agritech',
    type: 'Technologie',
    description: "Fournisseur de capteurs IoT et de matériel d'irrigation disponibles sur la boutique KILIMO.",
    year: '2025',
    logo: '⚙️',
    imageUrl: '/placeholder.svg',
    order: 2,
    isActive: true,
  },
  {
    slug: 'ong-developpement-rural',
    name: 'ONG de Développement Rural',
    type: 'Organisation à but non lucratif',
    description: "Partenaire pour le déploiement des programmes de formation en zones rurales.",
    year: '2024',
    logo: '🤝',
    imageUrl: '/placeholder.svg',
    order: 3,
    isActive: true,
  },
  {
    slug: 'plateforme-financement-vert',
    name: 'Plateforme de Financement Vert',
    type: 'Finance verte',
    description: "Partenaire pour le financement de projets agricoles durables et la compensation carbone.",
    year: '2025',
    logo: '💚',
    imageUrl: '/placeholder.svg',
    order: 4,
    isActive: true,
  },
  {
    slug: 'reseau-distributeurs-locaux',
    name: 'Réseau de Distributeurs Locaux',
    type: 'Distribution',
    description: "Réseau logistique partenaire pour la livraison des commandes de la boutique KILIMO.",
    year: '2025',
    logo: '🚚',
    imageUrl: '/placeholder.svg',
    order: 5,
    isActive: true,
  },
];

async function seedPartners() {
  console.log(`🤝 Création de ${partners.length} partenaires (contenu placeholder)...\n`);

  for (const data of partners) {
    const partner = await prisma.partner.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
    console.log(`✅ Partenaire : ${partner.name} (id=${partner.id}, slug=${partner.slug})`);
  }

  console.log(`\n🎉 ${partners.length} partenaires créés — à remplacer par vos vrais partenaires via l'admin.`);
}

seedPartners()
  .catch((e) => {
    console.error('❌ Erreur lors du seed des partenaires :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
