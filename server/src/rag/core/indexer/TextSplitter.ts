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

  // Detects a line that reads as a section heading in a typed technical
  // document (agronomy fiches, project plans, etc.): markdown headings,
  // numbered/lettered/roman-numeral section markers, or a short all-caps
  // line. Purely heuristic — text without any matching line falls back to
  // a single implicit section, i.e. today's paragraph-only behavior.
  private static readonly HEADING_PATTERNS = [
    /^#{1,6}\s+\S.*/,
    /^\d+[.)]\s+\S.{0,78}$/,
    /^[IVXLCDM]+[.)]\s+\S.{0,78}$/,
    /^[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ][A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ0-9\s:''\-]{2,78}$/,
  ];

  private isHeadingLine(line: string): boolean {
    if (!line || line.length > 80) return false;
    return TextSplitter.HEADING_PATTERNS.some((p) => p.test(line));
  }

  /**
   * Groups the text into sections at heading boundaries. A document with no
   * detected heading yields a single section with no title, so chunking
   * degrades gracefully to the pre-existing paragraph-based behavior.
   */
  private splitIntoSections(text: string): { heading: string | null; body: string }[] {
    const lines = text.split('\n');
    const sections: { heading: string | null; body: string }[] = [];
    let currentHeading: string | null = null;
    let currentBody: string[] = [];

    const flush = () => {
      const body = currentBody.join('\n').trim();
      if (body || currentHeading) {
        sections.push({ heading: currentHeading, body });
      }
      currentBody = [];
    };

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (this.isHeadingLine(trimmed)) {
        flush();
        currentHeading = trimmed.replace(/^#{1,6}\s+/, '');
      } else {
        currentBody.push(rawLine);
      }
    }
    flush();

    return sections.length > 0 ? sections : [{ heading: null, body: text }];
  }

  /**
   * Split text into chunks. Sections (see splitIntoSections) are chunked
   * independently — merging/overlap never crosses a section boundary — and
   * each resulting chunk is prefixed with its section heading, so both the
   * embedding and the LLM context carry that structural signal instead of a
   * bare paragraph stripped of which fiche/section it came from.
   */
  splitText(text: string): string[] {
    const sections = this.splitIntoSections(text);
    const result: string[] = [];
    for (const section of sections) {
      const bodyChunks = this.chunkBody(section.body);
      for (const chunk of bodyChunks) {
        result.push(section.heading ? `${section.heading}\n${chunk}` : chunk);
      }
    }
    return result;
  }

  /**
   * Original paragraph-merge-with-overlap chunking, scoped to a single
   * section's body text.
   */
  private chunkBody(text: string): string[] {
    const { chunkSize, chunkOverlap, separator } = this.config;

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
