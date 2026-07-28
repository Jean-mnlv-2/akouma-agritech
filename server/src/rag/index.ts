// ==========================================
// RAG Module - Public API
// ==========================================

import { PrismaClient } from '@prisma/client';
import {
  RagConfig,
  IRagOrchestrator,
  IKnowledgeIndexer,
  IEmbeddingService,
  IVectorStore,
} from './types';
import { createRagConfig, DEFAULT_RAG_CONFIG } from './config';
import { OllamaEmbeddingService } from './core/embedding/OllamaEmbedding';
import { PgVectorStore } from './core/vector-store/PgVectorStore';
import { DocumentIndexer } from './core/indexer/DocumentIndexer';
import { RagWorkflow } from './core/workflow/RagWorkflow';

export * from './types';
export * from './config';
export { RagWorkflow } from './core/workflow/RagWorkflow';
export { DocumentIndexer } from './core/indexer/DocumentIndexer';
export { PgVectorStore } from './core/vector-store/PgVectorStore';
export { OllamaEmbeddingService } from './core/embedding/OllamaEmbedding';
export { TextSplitter } from './core/indexer/TextSplitter';

export class RagSystem {
  public readonly config: RagConfig;
  public readonly embeddingService: IEmbeddingService;
  public readonly vectorStore: IVectorStore;
  public readonly indexer: IKnowledgeIndexer;
  public readonly orchestrator: IRagOrchestrator;
  private static instance: RagSystem | null = null;

  private constructor(
    prisma: PrismaClient,
    config: Partial<RagConfig> = {}
  ) {
    this.config = createRagConfig(config);

    // Initialize embedding service
    this.embeddingService = new OllamaEmbeddingService(this.config.embedding);

    // Initialize vector store
    this.vectorStore = new PgVectorStore(
      prisma,
      this.embeddingService,
      this.config.vectorStore,
      this.config.embedding
    );

    // Initialize document indexer
    this.indexer = new DocumentIndexer(
      prisma,
      this.config.textSplitter,
      this.embeddingService,
      this.vectorStore
    );

    // Initialize RAG orchestrator
    this.orchestrator = new RagWorkflow(
      this.embeddingService,
      this.vectorStore,
      this.config
    );
  }

  /**
   * Get or create the singleton RAG system instance
   */
  static getInstance(
    prisma: PrismaClient, config?: Partial<RagConfig>): RagSystem {
    if (!RagSystem.instance) {
      RagSystem.instance = new RagSystem(prisma, config);
    }
    return RagSystem.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    RagSystem.instance = null;
  }
}
