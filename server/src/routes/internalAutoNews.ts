import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { internalApiAuth } from '../middleware/internalApiAuth';
import { logger } from '../utils/logger';
import { slugify } from '../utils/slugify';

const prisma = new PrismaClient();
export const internalAutoNewsRouter = Router();

// Apply auth middleware to all routes on this router
internalAutoNewsRouter.use(internalApiAuth);

internalAutoNewsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      excerpt,
      imageUrl,
      author,
      category,
      sourceName,
      sourceUrl,
      keywords,
      language,
      isPublished = false,
      isFeatured = false,
      isCopyProtected = false,
      slug
    } = req.body;

    // Validate required fields (matches manual API: title, content, and we require slug OR title to generate it)
    if (!title || !content) {
      return res.status(400).json({ error: 'missing fields' });
    }

    let finalSlug: string;
    if (slug) {
      finalSlug = slug;
    } else {
      finalSlug = slugify(title);
    }

    let counter = 1;
    const baseSlug = finalSlug;
    while (true) {
      const existing = await prisma.news.findUnique({ where: { slug: finalSlug } });
      if (!existing) break;
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }

    // Check for duplicates: same slug already exists
    const duplicateCheck = await prisma.news.findUnique({
      where: { slug: finalSlug },
    });

    if (duplicateCheck) {
      logger.info(`Skipping duplicate news: title="${title}", source="${sourceName}"`);
      return res.status(200).json({
        status: 'skipped',
        message: 'News article already exists (duplicate)',
        data: duplicateCheck,
      });
    }

    // Create the news article (exact same structure as manual API)
    const newsArticle = await prisma.news.create({
      data: {
        title,
        content,
        excerpt: excerpt || null,
        imageUrl: imageUrl || null,
        author: author || 'KILIMO',
        category: category || null,
        slug: finalSlug,
        isPublished: Boolean(isPublished),
        isFeatured: Boolean(isFeatured),
        isCopyProtected: Boolean(isCopyProtected),
        sourceType: "auto",
        // Auto-news fields
        sourceName,
        sourceUrl,
        scrapedAt: new Date(),
        keywords: keywords || [],
        language: language || 'fr',
      },
    });

    logger.info(`Created auto-news draft: id=${newsArticle.id}, title="${title}"`);

    // Response exactly matches manual API's POST response structure
    return res.status(201).json({
      data: newsArticle,
    });

  } catch (error) {
    logger.error('Error in internal auto-news endpoint:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return res.status(500).json({ error: errMsg });
  }
});
