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
      this.indexShopProducts(),
      this.indexLegalPages(),
      this.indexPhytosanitaryProducts(),
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
        tier: doc.tier,
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

  /**
   * Index boutique products (agritech tools/equipment, not seeds)
   */
  async indexShopProducts(): Promise<void> {
    const products = await this.prisma.shopProduct.findMany({
      where: { isPublished: true, isActive: true },
    });

    const sources: KnowledgeSource[] = products.map((product) => ({
      id: `shopProduct-${product.id}`,
      title: product.name,
      content: this.formatShopProductContent(product),
      sourceType: 'shopProduct',
      metadata: {
        productId: product.id,
        price: product.price,
        category: product.category,
        slug: product.slug,
      },
      createdAt: product.createdAt,
    }));

    await this.indexer.indexSources(sources);
  }

  /**
   * Index legal/informational pages (terms, privacy, etc.)
   */
  async indexLegalPages(): Promise<void> {
    const pages = await this.prisma.legalPage.findMany({
      where: { isActive: true },
    });

    const sources: KnowledgeSource[] = pages.map((page) => ({
      id: `legalPage-${page.id}`,
      title: page.title,
      content: page.content,
      sourceType: 'legalPage',
      metadata: {
        legalPageId: page.id,
        slug: page.slug,
        type: page.type,
      },
      createdAt: page.createdAt,
    }));

    await this.indexer.indexSources(sources);
  }

  /**
   * Index les produits phytosanitaires — modèle structuré dédié (formulaire
   * admin), distinct des Document génériques. Le contenu indexé inclut
   * `commercialName` (voir formatPhytosanitaryProductContent) : la règle
   * métier n'est PAS "jamais de nom commercial", mais "jamais de nom
   * commercial sauf correspondance EXACTE" — si le produit retrouvé
   * correspond précisément à la culture et au ravageur/maladie de la
   * question (filtré par RagWorkflow.PHYTO_STRICT_SCORE_THRESHOLD), on
   * donne l'info complète, marque incluse ; sinon le produit n'est pas
   * retenu du tout et l'assistant retombe sur un conseil générique par
   * matière active (voir buildSystemPrompt). La `metadata` porte les
   * champs structurés (culture/ravageur ciblés) pour permettre un filtrage
   * strict côté RagWorkflow, en plus du filtrage sémantique par embedding.
   */
  async indexPhytosanitaryProducts(): Promise<void> {
    const products = await this.prisma.phytosanitaryProduct.findMany({
      where: { isActive: true },
    });

    const sources: KnowledgeSource[] = products.map((product) => ({
      id: `phytosanitaryProduct-${product.id}`,
      title: `${product.productType} — ${product.activeIngredient}`,
      content: this.formatPhytosanitaryProductContent(product),
      sourceType: 'phytosanitaryProduct',
      metadata: {
        productId: product.id,
        tier: product.tier,
        productType: product.productType,
        targetCrops: product.targetCrops,
        targetPests: product.targetPests,
        regulatoryStatus: product.regulatoryStatus,
      },
      createdAt: product.createdAt,
    }));

    await this.indexer.indexSources(sources);

    await this.prisma.phytosanitaryProduct.updateMany({
      where: { id: { in: products.map((p) => p.id) } },
      data: { isIndexed: true },
    });
  }

  private formatPhytosanitaryProductContent(product: any): string {
    return `Produit phytosanitaire — matière active: ${product.activeIngredient}
${product.commercialName ? `Nom commercial: ${product.commercialName}\n` : ''}Type: ${product.productType}
Statut réglementaire: ${product.regulatoryStatus}
Cultures ciblées: ${(product.targetCrops || []).join(', ') || 'Non spécifié'}
Ravageurs/maladies/adventices ciblés: ${(product.targetPests || []).join(', ') || 'Non spécifié'}

Description / mode d'action: ${product.description}
${product.dosage ? `Dosage recommandé: ${product.dosage}\n` : ''}${product.applicationMethod ? `Méthode d'application: ${product.applicationMethod}\n` : ''}${product.preHarvestInterval ? `Délai avant récolte (DAR): ${product.preHarvestInterval}\n` : ''}${product.safetyPrecautions ? `Précautions de sécurité: ${product.safetyPrecautions}\n` : ''}`;
  }

  private formatShopProductContent(product: any): string {
    return `Produit boutique: ${product.name}
Description: ${product.description || 'Non disponible'}
Catégorie: ${product.category || 'Général'}
Prix: ${product.price}
Caractéristiques: ${(product.features || []).join(', ') || 'Non disponible'}`;
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
