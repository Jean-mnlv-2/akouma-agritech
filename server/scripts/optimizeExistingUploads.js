/* eslint-disable no-console */
// Recompresse en WebP les images déjà uploadées AVANT l'ajout de
// l'optimisation automatique à l'upload (voir optimizeIfImage dans
// src/index.ts) — celle-ci ne s'applique qu'aux nouveaux uploads, les
// fichiers existants (PNG/JPG bruts de 1-2,5 Mo) restent tels quels tant
// qu'on ne les retraite pas explicitement ici.
//
// Idempotent : ignore toute URL qui n'est pas un /uploads/ local servi par
// ce backend (laisse intactes les images externes, ex: actus scrapées) et
// toute URL qui se termine déjà par .webp — relancer ce script plusieurs
// fois ne fait donc rien de plus après la première passe.
//
// À exécuter dans le même environnement que le backend (a accès au même
// volume /app/uploads), typiquement via la console Railway :
//   node scripts/optimizeExistingUploads.js
const { PrismaClient } = require('@prisma/client');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const uploadDir = path.resolve(process.cwd(), 'uploads');
const API_PUBLIC_URL = process.env.API_PUBLIC_URL || '';

function localFilenameFor(url) {
  if (typeof url !== 'string' || !url) return null;
  // Accepte aussi bien un chemin relatif ("/uploads/x.png") qu'une URL
  // absolue pointant vers CE backend — jamais une image externe.
  let pathname = url;
  if (/^https?:\/\//i.test(url)) {
    if (API_PUBLIC_URL && !url.startsWith(API_PUBLIC_URL)) return null;
    try {
      pathname = new URL(url).pathname;
    } catch {
      return null;
    }
  }
  if (!pathname.startsWith('/uploads/')) return null;
  if (pathname.toLowerCase().endsWith('.webp')) return null; // déjà optimisée
  return pathname.slice('/uploads/'.length);
}

// Un même fichier physique est souvent référencé par plusieurs champs (ex:
// imageUrl ET gallery[0] pointent vers la même image). Sans cache, la
// première conversion renomme/supprime l'original ; la deuxième référence,
// traitée juste après, ne retrouverait plus ce fichier et resterait cassée.
// On ne convertit donc chaque fichier source qu'une seule fois par run et on
// réutilise le résultat pour toute référence ultérieure au même nom.
const conversionCache = new Map();

async function optimizeFile(filename) {
  if (conversionCache.has(filename)) return conversionCache.get(filename);

  const originalPath = path.join(uploadDir, filename);
  if (!fs.existsSync(originalPath)) {
    console.warn(`  ⚠️  fichier introuvable, ignoré : ${filename}`);
    conversionCache.set(filename, null);
    return null;
  }
  const base = filename.replace(/\.[^.]+$/, '');
  const targetFilename = `${base}.webp`;
  const targetPath = path.join(uploadDir, targetFilename);
  const tmpPath = path.join(uploadDir, `${base}.tmp.webp`);
  const isGif = filename.toLowerCase().endsWith('.gif');

  let result;
  try {
    await sharp(originalPath, { animated: isGif })
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(tmpPath);
    await fs.promises.rename(tmpPath, targetPath);
    await fs.promises.unlink(originalPath).catch(() => void 0);
    result = targetFilename;
  } catch (e) {
    console.warn(`  ⚠️  sharp n'a pas pu traiter ${filename}, ignoré :`, e.message);
    result = null;
  }
  conversionCache.set(filename, result);
  return result;
}

function rewriteUrl(originalUrl, newFilename) {
  const idx = originalUrl.lastIndexOf('/uploads/');
  return `${originalUrl.slice(0, idx)}/uploads/${newFilename}`;
}

async function optimizeScalarField(modelName, prismaModel, field) {
  const rows = await prismaModel.findMany({ select: { id: true, [field]: true } });
  let fixed = 0;
  for (const row of rows) {
    const filename = localFilenameFor(row[field]);
    if (!filename) continue;
    const newFilename = await optimizeFile(filename);
    if (!newFilename) continue;
    await prismaModel.update({
      where: { id: row.id },
      data: { [field]: rewriteUrl(row[field], newFilename) },
    });
    fixed++;
  }
  if (fixed > 0) console.log(`✅ ${modelName}.${field} : ${fixed} image(s) optimisée(s)`);
  return fixed;
}

async function optimizeArrayField(modelName, prismaModel, field) {
  const rows = await prismaModel.findMany({ select: { id: true, [field]: true } });
  let fixed = 0;
  for (const row of rows) {
    const arr = row[field];
    if (!Array.isArray(arr) || arr.length === 0) continue;
    let changed = false;
    const next = [];
    for (const url of arr) {
      const filename = localFilenameFor(url);
      if (!filename) {
        next.push(url);
        continue;
      }
      const newFilename = await optimizeFile(filename);
      if (!newFilename) {
        next.push(url);
        continue;
      }
      next.push(rewriteUrl(url, newFilename));
      changed = true;
    }
    if (!changed) continue;
    await prismaModel.update({ where: { id: row.id }, data: { [field]: next } });
    fixed++;
  }
  if (fixed > 0) console.log(`✅ ${modelName}.${field} : ${fixed} ligne(s) optimisée(s)`);
  return fixed;
}

async function main() {
  console.log(`🖼️  Optimisation des images déjà uploadées (dossier ${uploadDir})...\n`);

  let total = 0;
  total += await optimizeScalarField('Seed', prisma.seed, 'imageUrl');
  total += await optimizeArrayField('Seed', prisma.seed, 'gallery');
  total += await optimizeScalarField('News', prisma.news, 'imageUrl');
  total += await optimizeScalarField('ShopProduct', prisma.shopProduct, 'imageUrl');
  total += await optimizeArrayField('ShopProduct', prisma.shopProduct, 'gallery');
  total += await optimizeScalarField('Partner', prisma.partner, 'logoUrl');
  total += await optimizeScalarField('Partner', prisma.partner, 'imageUrl');
  total += await optimizeScalarField('SuccessStory', prisma.successStory, 'imageUrl');
  total += await optimizeScalarField('Event', prisma.event, 'imageUrl');
  total += await optimizeScalarField('OrderItem', prisma.orderItem, 'imageUrl');
  total += await optimizeScalarField('PageHeaderImage', prisma.pageHeaderImage, 'imageUrl');

  console.log(total > 0 ? `\n🎉 ${total} image(s)/ligne(s) optimisée(s) au total.` : '\n✅ Rien à optimiser — toutes les images sont déjà en WebP.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'optimisation des images :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
