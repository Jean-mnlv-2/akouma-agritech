// ==========================================
// RAG Module - Embedding Service Interface
// ==========================================

import { IEmbeddingService, EmbeddingConfig } from '../../types';

/**
 * Abstract base class for embedding services
 */
export abstract class EmbeddingServiceBase implements IEmbeddingService {
  protected config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  abstract generateEmbedding(text: string, type?: 'query' | 'document'): Promise<number[]>;

  async generateEmbeddings(texts: string[], type: 'query' | 'document' = 'document'): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      embeddings.push(await this.generateEmbedding(text, type));
    }
    return embeddings;
  }
}
