// ==========================================
// RAG Module - Kilimo Knowledge Adapter
// ==========================================

import { PrismaClient } from '@prisma/client';
import { KnowledgeSource, IKnowledgeIndexer } from '../types';

export class KilimoKnowledgeAdapter {
  private prisma: PrismaClient;
  private indexer: IKnowledgeIndexer;

  constructor(prisma: PrismaClient, indexer: IKnowledgeIndexer) {
    this.prisma = prisma;
    this.indexer = indexer;
  }

  /**
   * Index all existing Kilimo content into RAG system
   */
  async indexAllContent(): Promise<void> {
    await Promise.all([
      this.indexSeeds(),
      this.indexCourses(),
      this.indexNews(),
      this.indexDocuments(),
    ]);
  }

  /**
   * Index custom documents
   */
  async indexDocuments(): Promise<void> {
    const documents = await this.prisma.document.findMany({
      where: { isActive: true },
    });

    const sources: KnowledgeSource[] = documents.map((doc) => ({
      id: `document-${doc.id}`,
      title: doc.title,
      content: doc.content,
      sourceType: doc.sourceType,
      metadata: {
        documentId: doc.id,
        description: doc.description,
        ...(doc.metadata as Record<string, any>),
      },
      createdAt: doc.createdAt,
    }));

    await this.indexer.indexSources(sources);

    // Mark documents as indexed
    await this.prisma.document.updateMany({
      where: { id: { in: documents.map((d) => d.id) } },
      data: { isIndexed: true },
    });
  }

  /**
   * Index seed products from the Kilimo store
   */
  async indexSeeds(): Promise<void> {
    const seeds = await this.prisma.seed.findMany({
      where: { isPublished: true },
    });

    const sources: KnowledgeSource[] = seeds.map(seed => ({
      id: `seed-${seed.id}`,
      title: seed.name,
      content: this.formatSeedContent(seed),
      sourceType: 'seed',
      metadata: {
        seedId: seed.id,
        price: seed.price,
        category: seed.category,
        slug: seed.slug,
      },
      createdAt: seed.createdAt,
    }));

    await this.indexer.indexSources(sources);
  }

  /**
   * Index e-learning courses
   */
  async indexCourses(): Promise<void> {
    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
    });

    const sources: KnowledgeSource[] = courses.map(course => ({
      id: `course-${course.id}`,
      title: course.title,
      content: this.formatCourseContent(course),
      sourceType: 'course',
      metadata: {
        courseId: course.id,
        price: course.price,
        category: course.category,
        slug: course.slug,
        level: course.level,
      },
      createdAt: course.createdAt,
    }));

    await this.indexer.indexSources(sources);
  }

  /**
   * Index news articles
   */
  async indexNews(): Promise<void> {
    const news = await this.prisma.news.findMany({
      where: { isPublished: true },
    });

    const sources: KnowledgeSource[] = news.map(article => ({
      id: `news-${article.id}`,
      title: article.title,
      content: this.formatNewsContent(article),
      sourceType: 'news',
      metadata: {
        newsId: article.id,
        category: article.category,
        slug: article.slug,
      },
      createdAt: article.createdAt,
    }));

    await this.indexer.indexSources(sources);
  }

  private formatSeedContent(seed: any): string {
    return `Produit: ${seed.name}
Description: ${seed.description}
Catégorie: ${seed.category || 'Général'}
Prix: ${seed.price}
Disponibilité: ${seed.availability || 'En stock'}

Instructions de plantation: ${seed.plantingInstructions || 'Non disponible'}
Instructions d'entretien: ${seed.careInstructions || 'Non disponible'}
${seed.fullDescription ? `\nDescription complète:\n${seed.fullDescription}` : ''}`;
  }

  private formatCourseContent(course: any): string {
    return `Formation: ${course.title}
Description: ${course.description}
Catégorie: ${course.category || 'Agriculture'}
Prix: ${course.price}
Niveau: ${course.level || 'Non spécifié'}
Langues: ${(course.languages || ['Français']).join(', ')}

${course.content ? `\nContenu:\n${course.content}` : ''}`;
  }

  private formatNewsContent(article: any): string {
    return `Article: ${article.title}
${article.excerpt ? `Résumé: ${article.excerpt}` : ''}
Catégorie: ${article.category || 'Général'}

${article.content}`;
  }
}
