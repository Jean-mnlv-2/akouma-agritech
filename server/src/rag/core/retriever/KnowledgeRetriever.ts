// ==========================================
// RAG Module - Knowledge Retriever
// ==========================================

import {
  SearchResult,
  IEmbeddingService,
  IVectorStore,
  RetrieverConfig,
} from '../../types';

export class KnowledgeRetriever {
  private embeddingService: IEmbeddingService;
  private vectorStore: IVectorStore;
  private config: RetrieverConfig;

  constructor(
    embeddingService: IEmbeddingService,
    vectorStore: IVectorStore,
    config: RetrieverConfig
  ) {
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
    this.config = config;
  }

  /**
   * Retrieve relevant knowledge chunks for a query
   */
  async retrieve(query: string, topK?: number, filters?: Record<string, any>): Promise<SearchResult[]> {
    const k = topK || this.config.topK;
    // Sur-échantillonne pour compenser les résultats perdus au filtrage par
    // seuil, sans jamais dépasser 20 candidats.
    const initialTopK = Math.min(k * 2, 20);
    const queryEmbedding = await this.embeddingService.generateEmbedding(query, 'query');

    let results = await this.vectorStore.search(queryEmbedding, initialTopK, filters);

    if (this.config.scoreThreshold) {
      results = results.filter(r => (r.score ?? 0) >= this.config.scoreThreshold!);
    }

    // NOTE: il n'y a volontairement plus de "rerank" ici. pgvector renvoie déjà
    // les résultats triés par similarité cosinus (le même calcul qu'un rerank
    // par ré-embedding aurait reproduit), donc reformuler la requête et
    // ré-embedder chaque chunk candidat (jusqu'à 20 appels HTTP Ollama
    // supplémentaires par message) n'apportait aucun gain de pertinence —
    // seulement de la latence.
    return results.slice(0, k);
  }

  /**
   * Format search results into a context string for LLM
   */
  formatContext(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'Aucune information pertinente trouvée.';
    }

    return results
      .map((result, index) => {
        return `[Source ${index + 1}: ${result.source.title}]
${result.chunk.content}
---`;
      })
      .join('\n');
  }
}
