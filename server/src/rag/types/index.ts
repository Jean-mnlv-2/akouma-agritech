// ==========================================
// RAG Module - Public Type Definitions
// ==========================================

/**
 * LLM configuration
 */
export interface LlmConfig {
  model: string;
  temperature: number;
  topP: number;
}

/**
 * Configuration for the RAG system
 */
export interface RagConfig {
  embedding: EmbeddingConfig;
  vectorStore: VectorStoreConfig;
  textSplitter: TextSplitterConfig;
  retriever: RetrieverConfig;
  llm: LlmConfig;
}

/**
 * Embedding service configuration
 */
export interface EmbeddingConfig {
  provider: 'ollama' | 'openai';
  apiKey?: string;
  baseUrl?: string;
  model: string;
  dimensions: number;
}

/**
 * Vector store configuration
 */
export interface VectorStoreConfig {
  type: 'pgvector';
  connectionString: string;
  tableName: string;
}

/**
 * Text splitter configuration
 */
export interface TextSplitterConfig {
  chunkSize: number;
  chunkOverlap: number;
  separator?: string;
}

/**
 * Retriever configuration
 */
export interface RetrieverConfig {
  topK: number;
  scoreThreshold?: number;
  filters?: Record<string, any>;
}

/**
 * Represents a knowledge source (document, article, etc.)
 */
export interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Represents a chunk of knowledge with embedding
 */
export interface KnowledgeChunk {
  id: string;
  sourceId: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  chunkIndex: number;
  createdAt?: Date;
}

/**
 * Result of a semantic search
 */
export interface SearchResult {
  chunk: KnowledgeChunk;
  source: KnowledgeSource;
  score: number;
}

/**
 * Request to query the RAG system
 */
export interface RagQueryRequest {
  query: string;
  conversationHistory?: ChatMessage[];
  filters?: Record<string, any>;
  topK?: number;
}

/**
 * Response from the RAG system
 */
export interface RagQueryResponse {
  answer: string;
  sources: SearchResult[];
  usesProSources: boolean;
  requiredTier: 'free' | 'standard' | 'premium';
  metadata?: Record<string, any>;
}

export interface RagRetrievedSourcesInfo {
  sources: SearchResult[];
  usesProSources: boolean;
  requiredTier: 'free' | 'standard' | 'premium';
}

/**
 * Chat message for conversation history
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

/**
 * Progress callback for indexing operations
 */
export type IndexProgressCallback = (progress: {
  current: number;
  total: number;
  sourceId: string;
  status: 'indexing' | 'completed' | 'failed';
  error?: Error;
}) => void;

// ==========================================
// Core Service Interfaces
// ==========================================

/**
 * Interface for embedding services
 */
export interface IEmbeddingService {
  /**
   * `type` distingue le texte de requête du texte de document : nomic-embed-text
   * (et la plupart des modèles d'embedding modernes) exige des préfixes
   * différents ("search_query: " / "search_document: ") pour produire des
   * vecteurs correctement discriminants — sans eux, les scores de similarité
   * sont structurellement plus bas et pertinent/non-pertinent devient
   * difficile à distinguer avec un seuil fixe.
   */
  generateEmbedding(text: string, type?: 'query' | 'document'): Promise<number[]>;
  generateEmbeddings(texts: string[], type?: 'query' | 'document'): Promise<number[][]>;
}

/**
 * Interface for vector stores
 */
export interface IVectorStore {
  addChunks(chunks: KnowledgeChunk[]): Promise<void>;
  search(queryEmbedding: number[], topK: number, filters?: Record<string, any>): Promise<SearchResult[]>;
  deleteChunks(sourceId: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Interface for knowledge indexer
 */
export interface IKnowledgeIndexer {
  indexSource(
    source: KnowledgeSource,
    progressCallback?: IndexProgressCallback
  ): Promise<void>;
  indexSources(
    sources: KnowledgeSource[],
    progressCallback?: IndexProgressCallback
  ): Promise<void>;
  deleteSource(sourceId: string): Promise<void>;
}

/**
 * Interface for RAG orchestrator
 */
export interface IRagOrchestrator {
  query(request: RagQueryRequest): Promise<RagQueryResponse>;
  queryStream(
    request: RagQueryRequest,
    onChunk: (chunk: string) => void,
    onSourcesResolved?: (info: RagRetrievedSourcesInfo) => Promise<void> | void
  ): Promise<RagQueryResponse>;
}
