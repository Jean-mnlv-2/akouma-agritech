// ==========================================
// RAG Module - Document Indexer
// ==========================================

import crypto from 'node:crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  IKnowledgeIndexer,
  KnowledgeSource,
  KnowledgeChunk,
  IndexProgressCallback,
  TextSplitterConfig,
} from '../../types';
import { TextSplitter } from './TextSplitter';
import { IEmbeddingService } from '../../types';
import { IVectorStore } from '../../types';

export class DocumentIndexer implements IKnowledgeIndexer {
  private prisma: PrismaClient;
  private textSplitter: TextSplitter;
  private embeddingService: IEmbeddingService;
  private vectorStore: IVectorStore;

  constructor(
    prisma: PrismaClient,
    textSplitterConfig: TextSplitterConfig,
    embeddingService: IEmbeddingService,
    vectorStore: IVectorStore
  ) {
    this.prisma = prisma;
    this.textSplitter = new TextSplitter(textSplitterConfig);
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
  }

  async indexSource(
    source: KnowledgeSource,
    progressCallback?: IndexProgressCallback
  ): Promise<void> {
    // Delete existing source and chunks if they exist
    await this.vectorStore.deleteChunks(source.id);
    await this.prisma.knowledgeSource.deleteMany({
      where: { id: source.id }
    });

    // Create the source in the database
    const createdSource = await this.prisma.knowledgeSource.create({
      data: {
        id: source.id,
        title: source.title,
        content: source.content,
        contentType: (source.metadata as Record<string, any>)?.contentType || 'text',
        sourceType: source.sourceType,
        metadata: source.metadata as Prisma.InputJsonObject,
        isActive: true,
        createdAt: source.createdAt,
      },
    });

    // Split the content into chunks
    const chunksText = this.textSplitter.splitText(source.content);

    // Create chunk objects
    const chunks: KnowledgeChunk[] = chunksText.map((text, index) => ({
      id: crypto.randomUUID(),
      sourceId: createdSource.id,
      content: text,
      metadata: {
        ...source.metadata,
        chunkIndex: index,
        totalChunks: chunksText.length,
      },
      chunkIndex: index,
      createdAt: new Date(),
    }));

    // Generate embeddings and add to vector store
    await this.vectorStore.addChunks(chunks);

    // Report progress
    progressCallback?.({
      current: chunks.length,
      total: chunks.length,
      sourceId: source.id,
      status: 'completed',
    });
  }

  async indexSources(
    sources: KnowledgeSource[],
    progressCallback?: IndexProgressCallback
  ): Promise<void> {
    let completed = 0;
    const total = sources.length;

    for (const source of sources) {
      try {
        await this.indexSource(source, (progress) => {
          progressCallback?.({
            ...progress,
            current: completed + progress.current,
            total: total,
          });
        });
        completed++;
      } catch (error) {
        console.error(`Failed to index source ${source.id}:`, error);
        progressCallback?.({
          current: completed,
          total,
          sourceId: source.id,
          status: 'failed',
          error: error as Error,
        });
      }
    }
  }

  async deleteSource(sourceId: string): Promise<void> {
    await this.vectorStore.deleteChunks(sourceId);
    // deleteMany (not delete): "supprimer si présent" doit être idempotent —
    // tous les appelants traitent déjà "rien à supprimer" comme un cas normal.
    await this.prisma.knowledgeSource.deleteMany({
      where: { id: sourceId },
    });
  }
}
