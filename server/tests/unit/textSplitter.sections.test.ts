import { describe, it, expect } from 'vitest';
import { TextSplitter } from '../../src/rag/core/indexer/TextSplitter';

describe('TextSplitter section-aware chunking', () => {
  const splitter = new TextSplitter({ chunkSize: 200, chunkOverlap: 30, separator: '\n\n' });

  it('behaves like plain paragraph chunking when no heading is present', () => {
    const plain = "Ceci est un premier paragraphe assez court.\n\nCeci est un second paragraphe, egalement assez court pour etre fusionne avec le premier si possible selon la taille configuree.";
    const chunks = splitter.splitText(plain);
    expect(chunks.length).toBeGreaterThan(0);
    // No heading detected -> no heading line should have been injected
    expect(chunks.every(c => !c.startsWith('FICHE'))).toBe(true);
  });

  it('groups chunks by section and prefixes each with its heading', () => {
    const structured = `FICHE SANITAIRE - MAIS

1. Identification du ravageur
La chenille legionnaire d'automne est un ravageur majeur du mais en Afrique de l'Ouest et centrale, causant des degats importants sur les jeunes plants.

2. Symptomes
Les feuilles presentent des trous caracteristiques en fenetre, souvent accompagnes de dejections visibles au coeur du plant infeste.

3. Methodes de lutte
Rotation des cultures, pieges a pheromones, et traitement biologique a base de Bacillus thuringiensis en cas de forte pression du ravageur.`;

    const chunks = splitter.splitText(structured);
    expect(chunks.length).toBeGreaterThan(0);

    // Every chunk should carry its section heading as a prefix
    const headings = ['1. Identification du ravageur', '2. Symptomes', '3. Methodes de lutte'];
    for (const chunk of chunks) {
      const hasKnownHeading = headings.some(h => chunk.startsWith(h));
      expect(hasKnownHeading).toBe(true);
    }

    // Content from different sections should never be merged into the same chunk
    const symptomsChunks = chunks.filter(c => c.startsWith('2. Symptomes'));
    expect(symptomsChunks.every(c => !c.includes('chenille legionnaire'))).toBe(true);
    expect(symptomsChunks.every(c => !c.includes('Rotation des cultures'))).toBe(true);
  });
});
