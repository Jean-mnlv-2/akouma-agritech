// ==========================================
// RAG Module - Configuration
// ==========================================

import { RagConfig } from '../types';

/**
 * Default configuration for the RAG system
 */
export const DEFAULT_RAG_CONFIG: RagConfig = {
  embedding: {
    provider: 'ollama',
    baseUrl: process.env.OLLAMA_URL || 'http://ollama:11434',
    // IMPORTANT: doit être un modèle d'embedding dédié, jamais le modèle de chat
    // (OLLAMA_MODEL) — un LLM généraliste comme llama3.2/qwen2.5 ne produit pas
    // d'embeddings exploitables. nomic-embed-text produit des vecteurs à 768
    // dimensions, sous la limite de 2000 imposée par les index HNSW/IVFFlat de
    // pgvector (cf. KnowledgeChunk.embedding et la migration RAG).
    model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
    dimensions: parseInt(process.env.OLLAMA_EMBEDDING_DIMENSIONS || '768', 10),
  },
  vectorStore: {
    type: 'pgvector',
    connectionString: process.env.DATABASE_URL || '',
    tableName: 'knowledge_chunks',
  },
  textSplitter: {
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '1000', 10),
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '200', 10),
    separator: '\n\n',
  },
  retriever: {
    topK: parseInt(process.env.RAG_RETRIEVER_TOP_K || '5', 10),
    scoreThreshold: parseFloat(process.env.RAG_RETRIEVER_SCORE_THRESHOLD || '0.5'),
  },
  llm: (() => {
    const raw = process.env.AI_PROVIDER;
    const provider = raw === 'gemini' ? 'gemini' : raw === 'deepseek' ? 'deepseek' : 'ollama';
    const model = provider === 'gemini'
      ? (process.env.GEMINI_MODEL || 'gemini-2.0-flash')
      : provider === 'deepseek'
      ? (process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash')
      : (process.env.OLLAMA_MODEL || 'llama3.2');
    const apiKey = provider === 'gemini'
      ? process.env.GEMINI_API_KEY
      : provider === 'deepseek'
      ? process.env.DEEPSEEK_API_KEY
      : undefined;
    return {
      provider,
      model,
      temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.3'),
      topP: parseFloat(process.env.OLLAMA_TOP_P || '0.9'),
      baseUrl: process.env.OLLAMA_URL || 'http://ollama:11434',
      // Gemini/DeepSeek uniquement — leurs services lèvent une erreur
      // explicite si absent quand ils sont le provider actif.
      apiKey,
    };
  })(),
};

/**
 * Create a RAG configuration with defaults
 */
export function createRagConfig(overrides: Partial<RagConfig> = {}): RagConfig {
  return {
    embedding: {
      ...DEFAULT_RAG_CONFIG.embedding,
      ...overrides.embedding,
    },
    vectorStore: {
      ...DEFAULT_RAG_CONFIG.vectorStore,
      ...overrides.vectorStore,
    },
    textSplitter: {
      ...DEFAULT_RAG_CONFIG.textSplitter,
      ...overrides.textSplitter,
    },
    retriever: {
      ...DEFAULT_RAG_CONFIG.retriever,
      ...overrides.retriever,
    },
    llm: {
      ...DEFAULT_RAG_CONFIG.llm,
      ...overrides.llm,
    },
  };
}
