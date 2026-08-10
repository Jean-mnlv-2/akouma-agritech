/* eslint-disable no-console */
// Réécrit en URL absolue toute valeur "/uploads/..." déjà enregistrée en
// base par les anciens endpoints d'upload (qui renvoyaient un chemin
// relatif — voir le fix dans index.ts / routes/partners.ts). Un chemin
// relatif se résout contre l'origine de la page qui l'affiche (le
// frontend) au lieu du backend qui sert réellement le fichier : 502 dès
// que front et back sont sur des domaines différents (Railway, Render...).
//
// Idempotent : ne touche que les valeurs commençant exactement par
// "/uploads/" ; une valeur déjà absolue (http...) n'est jamais retouchée,
// donc relancer ce script plusieurs fois ne fait rien de plus après la
// première passe.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const API_PUBLIC_URL = process.env.API_PUBLIC_URL;

function absolutize(value) {
  if (typeof value !== 'string' || !value.startsWith('/uploads/')) return value;
  return `${API_PUBLIC_URL}${value}`;
}

async function fixScalarField(modelName, prismaModel, field) {
  const rows = await prismaModel.findMany({
    where: { [field]: { startsWith: '/uploads/' } },
    select: { id: true, [field]: true },
  });
  for (const row of rows) {
    await prismaModel.update({
      where: { id: row.id },
      data: { [field]: absolutize(row[field]) },
    });
  }
  if (rows.length > 0) console.log(`✅ ${modelName}.${field} : ${rows.length} ligne(s) corrigée(s)`);
  return rows.length;
}

async function fixArrayField(modelName, prismaModel, field) {
  const rows = await prismaModel.findMany({ select: { id: true, [field]: true } });
  let fixed = 0;
  for (const row of rows) {
    const arr = row[field];
    if (!Array.isArray(arr) || arr.length === 0) continue;
    if (!arr.some((v) => typeof v === 'string' && v.startsWith('/uploads/'))) continue;
    await prismaModel.update({
      where: { id: row.id },
      data: { [field]: arr.map(absolutize) },
    });
    fixed++;
  }
  if (fixed > 0) console.log(`✅ ${modelName}.${field} : ${fixed} ligne(s) corrigée(s)`);
  return fixed;
}

async function main() {
  if (!API_PUBLIC_URL) {
    console.error('❌ API_PUBLIC_URL manquant dans l\'environnement — impossible de construire les URLs absolues.');
    process.exit(1);
  }
  console.log(`🔧 Correction des URLs /uploads/ relatives vers ${API_PUBLIC_URL}...\n`);

  let total = 0;
  total += await fixScalarField('Seed', prisma.seed, 'imageUrl');
  total += await fixArrayField('Seed', prisma.seed, 'gallery');
  total += await fixScalarField('News', prisma.news, 'imageUrl');
  total += await fixScalarField('ShopProduct', prisma.shopProduct, 'imageUrl');
  total += await fixArrayField('ShopProduct', prisma.shopProduct, 'gallery');
  total += await fixScalarField('Partner', prisma.partner, 'logoUrl');
  total += await fixScalarField('Partner', prisma.partner, 'imageUrl');
  total += await fixScalarField('SuccessStory', prisma.successStory, 'imageUrl');
  total += await fixScalarField('Event', prisma.event, 'imageUrl');
  total += await fixScalarField('OrderItem', prisma.orderItem, 'imageUrl');
  total += await fixScalarField('PageHeaderImage', prisma.pageHeaderImage, 'imageUrl');

  console.log(total > 0 ? `\n🎉 ${total} ligne(s) corrigée(s) au total.` : '\n✅ Rien à corriger — toutes les URLs sont déjà absolues.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la correction des URLs :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
