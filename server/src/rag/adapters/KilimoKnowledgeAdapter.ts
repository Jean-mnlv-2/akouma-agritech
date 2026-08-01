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
   * Supprime les KnowledgeSource dont l'id porte ce préfixe (ex. "seed-") et
   * qui ne correspondent plus à aucun enregistrement actif/publié actuel.
   * Sans ça, un contenu désactivé (isActive/isPublished → false) reste
   * indéfiniment indexé et cité par l'assistant : indexX() ci-dessous
   * n'ajoute/rafraîchit que les items actuellement actifs, il ne purge
   * jamais ceux qui ne le sont plus. On filtre par préfixe d'id plutôt que
   * par sourceType : pour les Document, sourceType porte le type du contenu
   * (manual/guide/pdf...), pas un identifiant stable de "famille".
   * Le cascade onDelete sur KnowledgeChunk.source nettoie les chunks associés.
   */
  private async pruneStaleSources(idPrefix: string, activeIds: string[]): Promise<void> {
    await this.prisma.knowledgeSource.deleteMany({
      where: { id: { startsWith: idPrefix, notIn: activeIds } },
    });
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
      this.indexEvents(),
      this.indexPartners(),
      this.indexSuccessStories(),
      this.indexDonationImpacts(),
      this.indexCareers(),
      this.indexLiveStreams(),
    ]);
  }

  /**
   * Ajoute une mention "Portée / Sources" en fin de contenu indexé — pas
   * seulement en métadonnée, qui n'est jamais montrée au LLM
   * (KnowledgeRetriever.formatContext n'expose que source.title +
   * chunk.content). Sans ça, la traçabilité saisie via
   * Document.sources/region resterait invisible pour l'assistant, qui ne
   * pourrait jamais citer ses sources même quand on le lui demande.
   */
  private appendProvenance(content: string, sources: unknown, region: string | null): string {
    const lines: string[] = [];
    if (region) lines.push(`Portée géographique : ${region}`);
    if (Array.isArray(sources) && sources.length > 0) {
      const list = sources
        .map((s: any) => (s?.name ? `${s.name}${s.url ? ` (${s.url})` : ''}` : null))
        .filter(Boolean)
        .join(', ');
      if (list) lines.push(`Sources : ${list}`);
    }
    return lines.length > 0 ? `${content}\n\n${lines.join('\n')}` : content;
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
      content: this.appendProvenance(doc.content, doc.sources, doc.region),
      sourceType: doc.sourceType,
      metadata: {
        documentId: doc.id,
        description: doc.description,
        tier: doc.tier,
        sources: doc.sources,
        region: doc.region,
        ...(doc.metadata as Record<string, any>),
      },
      createdAt: doc.createdAt,
    }));

    await this.indexer.indexSources(sources);
    await this.pruneStaleSources('document-', sources.map((s) => s.id));

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
    await this.pruneStaleSources('seed-', sources.map((s) => s.id));
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
    await this.pruneStaleSources('course-', sources.map((s) => s.id));
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
    await this.pruneStaleSources('news-', sources.map((s) => s.id));
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
    await this.pruneStaleSources('shopProduct-', sources.map((s) => s.id));
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
    await this.pruneStaleSources('legalPage-', sources.map((s) => s.id));
  }

  /**
   * Index public events (agenda page)
   */
  async indexEvents(): Promise<void> {
    const events = await this.prisma.event.findMany({
      where: { isPublished: true },
    });

    const sources: KnowledgeSource[] = events.map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      content: this.formatEventContent(event),
      sourceType: 'event',
      metadata: {
        eventId: event.id,
        date: event.date,
        location: event.location,
        slug: event.slug,
      },
      createdAt: event.createdAt,
    }));

    await this.indexer.indexSources(sources);
    await this.pruneStaleSources('event-', sources.map((s) => s.id));
  }

  /**
   * Index partners (showcased on the partners page)
   */
  async indexPartners(): Promise<void> {
    const partners = await this.prisma.partner.findMany({
      where: { isActive: true },
    });

    const sources: KnowledgeSource[] = partners.map((partner) => ({
      id: `partner-${partner.id}`,
      title: partner.name,
      content: this.formatPartnerContent(partner),
      sourceType: 'partner',
      metadata: {
        partnerId: partner.id,
        type: partner.type,
        slug: partner.slug,
      },
      createdAt: partner.createdAt,
    }));

    await this.indexer.indexSources(sources);
    await this.pruneStaleSources('partner-', sources.map((s) => s.id));
  }

  /**
   * Index donor success stories
   */
  async indexSuccessStories(): Promise<void> {
    const stories = await this.prisma.successStory.findMany({
      where: { isActive: true },
    });

    const sources: KnowledgeSource[] = stories.map((story) => ({
      id: `successStory-${story.id}`,
      title: story.title,
      content: this.formatSuccessStoryContent(story),
      sourceType: 'successStory',
      metadata: {
        successStoryId: story.id,
        year: story.year,
        slug: story.slug,
      },
      createdAt: story.createdAt,
    }));

    await this.indexer.indexSources(sources);
    await this.pruneStaleSources('successStory-', sources.map((s) => s.id));
  }

  /**
   * Index donation impact figures (shown on the donations page)
   */
  async indexDonationImpacts(): Promise<void> {
    const impacts = await this.prisma.donationImpact.findMany({
      where: { isActive: true },
    });

    const sources: KnowledgeSource[] = impacts.map((impact) => ({
      id: `donationImpact-${impact.id}`,
      title: impact.title,
      content: this.formatDonationImpactContent(impact),
      sourceType: 'donationImpact',
      metadata: {
        donationImpactId: impact.id,
        slug: impact.slug,
      },
      createdAt: impact.createdAt,
    }));

    await this.indexer.indexSources(sources);
    await this.pruneStaleSources('donationImpact-', sources.map((s) => s.id));
  }

  /**
   * Index open job postings (careers page)
   */
  async indexCareers(): Promise<void> {
    const careers = await this.prisma.career.findMany({
      where: { isPublished: true },
    });

    const sources: KnowledgeSource[] = careers.map((career) => ({
      id: `career-${career.id}`,
      title: career.title,
      content: this.formatCareerContent(career),
      sourceType: 'career',
      metadata: {
        careerId: career.id,
        location: career.location,
        employmentType: career.employmentType,
        slug: career.slug,
      },
      createdAt: career.createdAt,
    }));

    await this.indexer.indexSources(sources);
    await this.pruneStaleSources('career-', sources.map((s) => s.id));
  }

  /**
   * Index live/replay streaming sessions. Pas de champ isActive/isPublished
   * sur ce modèle (par design : une session passée reste une info publique
   * valide — replay, date passée), donc pas de filtre ici, contrairement aux
   * autres types.
   */
  async indexLiveStreams(): Promise<void> {
    const streams = await this.prisma.liveStream.findMany();

    const sources: KnowledgeSource[] = streams.map((stream) => ({
      id: `liveStream-${stream.id}`,
      title: stream.title,
      content: this.formatLiveStreamContent(stream),
      sourceType: 'liveStream',
      metadata: {
        liveStreamId: stream.id,
        category: stream.category,
        scheduledTime: stream.scheduledTime,
        slug: stream.slug,
      },
      createdAt: stream.createdAt,
    }));

    await this.indexer.indexSources(sources);
    await this.pruneStaleSources('liveStream-', sources.map((s) => s.id));
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
      content: this.appendProvenance(this.formatPhytosanitaryProductContent(product), product.sources, product.region),
      sourceType: 'phytosanitaryProduct',
      metadata: {
        productId: product.id,
        tier: product.tier,
        productType: product.productType,
        targetCrops: product.targetCrops,
        targetPests: product.targetPests,
        regulatoryStatus: product.regulatoryStatus,
        sources: product.sources,
        region: product.region,
      },
      createdAt: product.createdAt,
    }));

    await this.indexer.indexSources(sources);
    await this.pruneStaleSources('phytosanitaryProduct-', sources.map((s) => s.id));

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

  private formatEventContent(event: any): string {
    const date = event.date instanceof Date ? event.date.toLocaleDateString('fr-FR') : event.date;
    return `Événement: ${event.title}
Date: ${date}
Lieu: ${event.location}

${event.description || 'Aucune description disponible.'}`;
  }

  private formatPartnerContent(partner: any): string {
    return `Partenaire: ${partner.name}
${partner.type ? `Type: ${partner.type}\n` : ''}${partner.year ? `Partenaire depuis: ${partner.year}\n` : ''}${partner.website ? `Site web: ${partner.website}\n` : ''}
${partner.description || 'Aucune description disponible.'}`;
  }

  private formatSuccessStoryContent(story: any): string {
    return `Témoignage de réussite: ${story.title}
${story.year ? `Année: ${story.year}\n` : ''}
${story.description}

Impact: ${story.impact}`;
  }

  private formatDonationImpactContent(impact: any): string {
    return `Impact des dons: ${impact.title}
${impact.target ? `Objectif: ${impact.target}\n` : ''}Progression: ${impact.progress}%

${impact.description}`;
  }

  private formatCareerContent(career: any): string {
    return `Offre d'emploi: ${career.title}
Lieu: ${career.location}
Type de contrat: ${career.employmentType}
${career.department ? `Département: ${career.department}\n` : ''}${career.salaryRange ? `Rémunération: ${career.salaryRange}\n` : ''}${career.applicationDeadline ? `Date limite de candidature: ${new Date(career.applicationDeadline).toLocaleDateString('fr-FR')}\n` : ''}
Description: ${career.description}
${career.requirements ? `\nProfil recherché: ${career.requirements}` : ''}`;
  }

  private formatLiveStreamContent(stream: any): string {
    const when = stream.scheduledTime ? new Date(stream.scheduledTime).toLocaleString('fr-FR') : 'Non planifié';
    return `Session en direct: ${stream.title}
${stream.instructorName ? `Intervenant: ${stream.instructorName}\n` : ''}${stream.category ? `Catégorie: ${stream.category}\n` : ''}Horaire: ${when}
Statut: ${stream.isLive ? 'En direct actuellement' : (stream.recordingUrl ? 'Rediffusion disponible' : 'À venir')}

${stream.description || 'Aucune description disponible.'}`;
  }
}
