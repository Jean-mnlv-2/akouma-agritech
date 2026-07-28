// ==========================================
// RAG Module - Ollama Embedding Service
// ==========================================

import { EmbeddingServiceBase } from './EmbeddingService';
import { EmbeddingConfig } from '../../types';

/**
 * Ollama-based embedding service
 */
export class OllamaEmbeddingService extends EmbeddingServiceBase {
  private baseUrl: string;

  constructor(config: EmbeddingConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://ollama:11434';
  }

  async generateEmbedding(text: string, type: 'query' | 'document' = 'document'): Promise<number[]> {
    // nomic-embed-text (et la plupart des modèles d'embedding récents) exige
    // ce préfixe pour produire des vecteurs correctement discriminants entre
    // requête et document — sans lui, les scores de similarité sont
    // structurellement plus bas et un seuil fixe ne peut pas bien filtrer.
    const prefixedText = type === 'query' ? `search_query: ${text}` : `search_document: ${text}`;
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: prefixedText,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama embedding failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('[RAG] Ollama embedding error:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateEmbeddings(texts: string[], type: 'query' | 'document' = 'document'): Promise<number[][]> {
    // Process in parallel with a limit to avoid overwhelming Ollama
    const concurrency = 3;
    const results: number[][] = new Array(texts.length);
    let index = 0;

    const worker = async () => {
      while (index < texts.length) {
        const currentIndex = index++;
        try {
          results[currentIndex] = await this.generateEmbedding(texts[currentIndex], type);
        } catch (error) {
          console.error(`[RAG] Failed to generate embedding for text ${currentIndex}:`, error);
          throw error;
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, texts.length) }, worker);
    await Promise.all(workers);

    return results;
  }
}
