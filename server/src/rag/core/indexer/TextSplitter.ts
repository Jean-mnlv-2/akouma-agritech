// ==========================================
// RAG Module - Text Splitter
// ==========================================

import { TextSplitterConfig } from '../../types';

/**
 * Splits text into chunks for embedding
 */
export class TextSplitter {
  private config: TextSplitterConfig;

  constructor(config: TextSplitterConfig) {
    this.config = config;
  }

  /**
   * Split text into chunks
   */
  splitText(text: string): string[] {
    const { chunkSize, chunkOverlap, separator } = this.config;
    const chunks: string[] = [];

    // First split by separator
    let initialChunks = text.split(separator || '\n\n');

    // Merge small chunks
    const mergedChunks: string[] = [];
    let currentChunk = '';

    for (const chunk of initialChunks) {
      const trimmedChunk = chunk.trim();
      if (!trimmedChunk) continue;

      if (currentChunk.length + trimmedChunk.length <= chunkSize) {
        currentChunk = currentChunk
          ? `${currentChunk}${separator}${trimmedChunk}`
          : trimmedChunk;
      } else {
        if (currentChunk) {
          mergedChunks.push(currentChunk);
        }
        // If chunk is larger than chunkSize, split it further
        if (trimmedChunk.length > chunkSize) {
          const subChunks = this.splitByCharacter(trimmedChunk, chunkSize);
          mergedChunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = trimmedChunk;
        }
      }
    }

    if (currentChunk) {
      mergedChunks.push(currentChunk);
    }

    // Préfixe chaque chunk (sauf le premier) avec la fin du chunk précédent,
    // au lieu d'ajouter un chunk supplémentaire en plus du chunk brut : la
    // version précédente poussait `[A, overlap(A)+B, B, overlap(B)+C, C]`,
    // dupliquant B et C dans l'index (deux fois plus d'appels d'embedding, et
    // des résultats de recherche redondants pour une même source).
    const result: string[] = [];
    for (let i = 0; i < mergedChunks.length; i++) {
      if (i === 0 || chunkOverlap <= 0) {
        result.push(mergedChunks[i]);
        continue;
      }
      const overlapText = this.getOverlap(mergedChunks[i - 1], chunkOverlap);
      const withOverlap = overlapText ? `${overlapText}${separator}${mergedChunks[i]}` : mergedChunks[i];
      result.push(withOverlap.length <= chunkSize ? withOverlap : mergedChunks[i]);
    }

    return result;
  }

  /**
   * Split text by character limit
   */
  private splitByCharacter(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let i = 0;

    while (i < text.length) {
      let end = Math.min(i + chunkSize, text.length);

      // Try to end at a word boundary
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > i) {
          end = lastSpace + 1;
        }
      }

      chunks.push(text.slice(i, end).trim());
      i = end;
    }

    return chunks;
  }

  /**
   * Get overlapping text from the end of a chunk
   */
  private getOverlap(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text;

    const lastSpace = text.lastIndexOf(' ', text.length - overlapSize);
    if (lastSpace > 0) {
      return text.slice(lastSpace + 1).trim();
    }

    return text.slice(-overlapSize).trim();
  }
}
