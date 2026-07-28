#!/usr/bin/env node
/**
 * Réintègre les traductions professionnelles depuis translations/i18n-missing-<lang>.csv
 * (colonne "translation" remplie) dans src/i18n/i18n.tsx.
 *
 * Usage : node scripts/merge-translations.cjs
 *
 * Régénère translations/i18n-missing-<lang>.csv en ne conservant que les lignes
 * encore non traduites (pour pouvoir relancer le script après un lot partiel).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const I18N_FILE = path.join(ROOT, 'src/i18n/i18n.tsx');
const TRANSLATIONS_DIR = path.join(ROOT, 'translations');
const LANGS = ['sw', 'ha', 'yo', 'ar', 'ru', 'zh', 'de'];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\r' && text[i + 1] === '\n') {
      row.push(field); field = ''; rows.push(row); row = []; i++;
    } else if (c === '\n') {
      row.push(field); field = ''; rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || r[0] !== '');
}

function toCsvField(value) {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toJsStringLiteral(value) {
  // Une ligne unique dans i18n.tsx (comme le reste du fichier) : on aplatit
  // les retours à la ligne éventuels saisis par le traducteur.
  const flattened = String(value).replace(/\r?\n/g, ' ').trim();
  return flattened.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Trouve le bloc `  <lang>: { ... }` en respectant les chaînes (les valeurs
// ne doivent jamais contenir de "{"/"}" non protégés, mais on reste robuste
// même si c'était le cas).
function findLangBlock(content, lang) {
  const openMarker = new RegExp(`(^|\\r?\\n)  ${lang}: \\{`);
  const m = openMarker.exec(content);
  if (!m) return null;
  const braceStart = m.index + m[0].length - 1; // index du "{"
  let depth = 0;
  let inString = false;
  let i = braceStart;
  for (; i < content.length; i++) {
    const c = content[i];
    if (inString) {
      if (c === '\\') { i++; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return { braceStart, braceEnd: i }; // content[braceEnd] === '}'
}

function main() {
  let i18nContent = fs.readFileSync(I18N_FILE, 'utf8');
  let totalMerged = 0;

  for (const lang of LANGS) {
    const csvPath = path.join(TRANSLATIONS_DIR, `i18n-missing-${lang}.csv`);
    if (!fs.existsSync(csvPath)) continue;

    const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
    if (rows.length === 0) continue;
    const header = rows[0];
    const dataRows = rows.slice(1);
    const [keyIdx, frIdx, enIdx, trIdx] = ['key', 'french_reference', 'english_reference', 'translation'].map(h => header.indexOf(h));

    const translated = dataRows.filter(r => (r[trIdx] || '').trim() !== '');
    const stillMissing = dataRows.filter(r => (r[trIdx] || '').trim() === '');

    if (translated.length === 0) {
      console.log(`${lang}: rien à fusionner (0 ligne traduite sur ${dataRows.length}).`);
      continue;
    }

    const block = findLangBlock(i18nContent, lang);
    if (!block) {
      console.error(`${lang}: bloc introuvable dans i18n.tsx — ignoré.`);
      continue;
    }

    const insertion = translated
      .map(r => `    "${r[keyIdx]}": "${toJsStringLiteral(r[trIdx])}",`)
      .join('\r\n');

    let before = i18nContent.slice(0, block.braceEnd).replace(/[ \t\r\n]+$/, '');
    if (!before.endsWith(',')) before += ','; // dernière entrée existante sans virgule finale
    i18nContent = before + '\r\n' + insertion + '\r\n  ' + i18nContent.slice(block.braceEnd);

    totalMerged += translated.length;
    console.log(`${lang}: ${translated.length} clé(s) fusionnée(s), ${stillMissing.length} restante(s).`);

    const newHeader = ['key', 'french_reference', 'english_reference', 'translation'].join(',');
    const newRows = stillMissing.map(r => [toCsvField(r[keyIdx]), toCsvField(r[frIdx]), toCsvField(r[enIdx]), ''].join(','));
    fs.writeFileSync(csvPath, [newHeader, ...newRows].join('\r\n'), 'utf8');
  }

  if (totalMerged > 0) {
    fs.writeFileSync(I18N_FILE, i18nContent, 'utf8');
    console.log(`\n${totalMerged} traduction(s) fusionnée(s) dans src/i18n/i18n.tsx. Vérifie avec: npx tsc -p tsconfig.app.json --noEmit`);
  } else {
    console.log('\nAucune traduction à fusionner (colonnes "translation" vides).');
  }
}

main();
