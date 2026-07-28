// ==========================================
// RAG Module - PostgreSQL Vector Store
// ==========================================

import { PrismaClient, Prisma } from '@prisma/client';
import {
  IVectorStore,
  KnowledgeChunk,
  SearchResult,
  VectorStoreConfig,
  EmbeddingConfig,
} from '../../types';
import { IEmbeddingService } from '../../types';

export class PgVectorStore implements IVectorStore {
  private prisma: PrismaClient;
  private embeddingService: IEmbeddingService;
  private config: VectorStoreConfig;
  private embeddingConfig: EmbeddingConfig;

  constructor(
    prisma: PrismaClient,
    embeddingService: IEmbeddingService,
    config: VectorStoreConfig,
    embeddingConfig: EmbeddingConfig
  ) {
    this.prisma = prisma;
    this.embeddingService = embeddingService;
    this.config = config;
    this.embeddingConfig = embeddingConfig;
  }

  async addChunks(chunks: KnowledgeChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    // Generate embeddings for chunks that don't have them
    const chunksToEmbed = chunks.filter(c => !c.embedding);
    if (chunksToEmbed.length > 0) {
      const texts = chunksToEmbed.map(c => c.content);
      const embeddings = await this.embeddingService.generateEmbeddings(texts);
      
      chunksToEmbed.forEach((chunk, index) => {
        chunk.embedding = embeddings[index];
      });
    }

    // Insert chunks in bulk for better performance
    if (chunks.length > 0) {
      const dimension = this.embeddingConfig.dimensions || 768;
      const values = chunks.map(chunk => {
        const embeddingValues = chunk.embedding ? chunk.embedding.map(n => Prisma.sql`${n}`) : null;
        return Prisma.sql`(
          ${chunk.id},
          ${chunk.sourceId},
          ${chunk.content},
          ${JSON.stringify(chunk.metadata)}::jsonb,
          ${embeddingValues ? Prisma.sql`ARRAY[${Prisma.join(embeddingValues)}]::vector(${Prisma.raw(dimension.toString())})` : Prisma.sql`NULL`},
          ${chunk.chunkIndex},
          ${chunk.createdAt || new Date()}
        )`;
      });

      await this.prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" ("id", "sourceId", "content", "metadata", "embedding", "chunkIndex", "createdAt")
        VALUES ${Prisma.join(values)}
        ON CONFLICT ("id") DO UPDATE SET
          "content" = EXCLUDED."content",
          "metadata" = EXCLUDED."metadata",
          "embedding" = EXCLUDED."embedding",
          "chunkIndex" = EXCLUDED."chunkIndex"
      `;
    }
  }

  async search(
    queryEmbedding: number[],
    topK: number,
    filters?: Record<string, any>
  ): Promise<SearchResult[]> {
    const dimension = this.embeddingConfig.dimensions || 768;
    const embeddingValues = queryEmbedding.map(n => Prisma.sql`${n}`);
    
    const results = await this.prisma.$queryRaw`
      SELECT 
        kc.id as "chunkId",
        kc."sourceId",
        kc.content,
        kc.metadata,
        kc."chunkIndex",
        kc."createdAt",
        ks.id as "sourceId_ks",
        ks.title as "sourceTitle",
        ks.content as "sourceContent",
        ks."sourceType",
        ks.metadata as "sourceMetadata",
        1 - (kc.embedding <=> ARRAY[${Prisma.join(embeddingValues)}]::vector(${Prisma.raw(dimension.toString())})) as "score"
      FROM "KnowledgeChunk" kc
      INNER JOIN "KnowledgeSource" ks ON kc."sourceId" = ks.id
      WHERE ks."isActive" = true
      ORDER BY kc.embedding <=> ARRAY[${Prisma.join(embeddingValues)}]::vector(${Prisma.raw(dimension.toString())})
      LIMIT ${topK}
    ` as any[];

    return results.map((row: any) => ({
      chunk: {
        id: row.chunkId,
        sourceId: row.sourceId,
        content: row.content,
        metadata: row.metadata,
        chunkIndex: row.chunkIndex,
        createdAt: row.createdAt,
      },
      source: {
        id: row.sourceId_ks,
        title: row.sourceTitle,
        content: row.sourceContent,
        sourceType: row.sourceType,
        metadata: row.sourceMetadata,
        createdAt: row.createdAt,
      },
      score: row.score,
    }));
  }

  async deleteChunks(sourceId: string): Promise<void> {
    await this.prisma.knowledgeChunk.deleteMany({
      where: { sourceId },
    });
  }

  async clear(): Promise<void> {
    await this.prisma.knowledgeChunk.deleteMany({});
    await this.prisma.knowledgeSource.deleteMany({});
  }
}
