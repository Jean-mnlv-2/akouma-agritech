import Parser from 'rss-parser';
import { PrismaClient, News } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NEWS_SOURCES, NewsSource, getEnabledSources } from '../config/newsSources';
import { logger } from '../utils/logger';
import { slugify } from '../utils/slugify';

const prisma = new PrismaClient();
const parser = new Parser();

export interface ScrapedArticle {
  title: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  author: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  language: 'fr' | 'en';
  publishedAt: Date | null;
  originalId: string | null;
}

export class NewsScraperService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Clear cache periodically
    setInterval(() => {
      this.clearExpiredCache();
    }, 5 * 60 * 1000);
  }

  private clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  private getCacheKey(sourceId: string): string {
    return `news_source:${sourceId}`;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  async scrapeRSS(source: NewsSource): Promise<ScrapedArticle[]> {
    const cacheKey = this.getCacheKey(source.id);
    const cached = this.getCache(cacheKey);
    if (cached) {
      logger.debug(`[NewsScraper] Using cached data for ${source.name}`);
      return cached;
    }

    try {
      logger.info(`[NewsScraper] Scraping RSS: ${source.name} (${source.url})`);
      
      const feed = await parser.parseURL(source.url);
      const articles: ScrapedArticle[] = [];

      for (const item of feed.items) {
        try {
          const article = await this.parseRSSItem(item, source);
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          logger.warn(`[NewsScraper] Failed to parse item from ${source.name}:`, error);
        }
      }

      this.setCache(cacheKey, articles);
      logger.info(`[NewsScraper] Successfully scraped ${articles.length} articles from ${source.name}`);
      return articles;
    } catch (error) {
      logger.error(`[NewsScraper] Failed to scrape RSS ${source.name}:`, error);
      return [];
    }
  }

  async scrapeWeb(source: NewsSource): Promise<ScrapedArticle[]> {
    const cacheKey = this.getCacheKey(source.id);
    const cached = this.getCache(cacheKey);
    if (cached) {
      logger.debug(`[NewsScraper] Using cached data for ${source.name}`);
      return cached;
    }

    try {
      logger.info(`[NewsScraper] Scraping web: ${source.name} (${source.url})`);
      
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const articles: ScrapedArticle[] = [];

      articles.push(...this.parseWebPage($, source));
      
      this.setCache(cacheKey, articles);
      logger.info(`[NewsScraper] Successfully scraped ${articles.length} articles from ${source.name}`);
      return articles;
    } catch (error) {
      logger.error(`[NewsScraper] Failed to scrape web ${source.name}:`, error);
      return [];
    }
  }

  private parseRSSItem(item: Parser.Item & { creator?: string; author?: string }, source: NewsSource): ScrapedArticle | null {
    if (!item.title || !item.link) {
      return null;
    }

    const content = item.contentSnippet || item.content || item.title;
    const excerpt = item.contentSnippet || this.createExcerpt(content);

    return {
      title: item.title,
      content: this.cleanHTML(content),
      excerpt: excerpt,
      imageUrl: this.extractImage(item),
      author: item.creator || item.author || source.name,
      category: source.category,
      sourceName: source.name,
      sourceUrl: item.link,
      language: source.language,
      publishedAt: item.pubDate ? new Date(item.pubDate) : null,
      originalId: item.guid || item.link,
    };
  }

  private parseWebPage($: cheerio.CheerioAPI, source: NewsSource): ScrapedArticle[] {
    const articles: ScrapedArticle[] = [];
    
    $('article, .post, .news-item, .article-item').each((_, element) => {
      const $el = $(element);
      const title = $el.find('h1, h2, h3, .title').first().text().trim();
      const link = $el.find('a').first().attr('href');
      
      if (!title || !link) return;

      const content = $el.find('.content, .excerpt, p').first().text().trim() || title;
      
      articles.push({
        title,
        content: this.cleanHTML(content),
        excerpt: this.createExcerpt(content),
        imageUrl: $el.find('img').first().attr('src') || null,
        author: source.name,
        category: source.category,
        sourceName: source.name,
        sourceUrl: this.resolveUrl(link, source.url),
        language: source.language,
        publishedAt: null,
        originalId: link,
      });
    });

    return articles;
  }

  private extractImage(item: Parser.Item): string | null {
    if (item.enclosure?.url) {
      return item.enclosure.url;
    }
    
    if (item.content) {
      const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
      if (imgMatch) {
        return imgMatch[1];
      }
    }
    
    return null;
  }

  private cleanHTML(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  private createExcerpt(content: string, maxLength: number = 200): string {
    const cleaned = this.cleanHTML(content);
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength).trim() + '...';
  }

  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return baseUrl;
    }
  }

  async saveArticle(article: ScrapedArticle): Promise<News | null> {
    try {
      const slug = slugify(article.title);
      
      const existing = await prisma.news.findFirst({
        where: {
          OR: [
            { slug: { startsWith: slug } },
            { originalId: article.originalId },
            { sourceUrl: article.sourceUrl },
          ],
        },
      });

      if (existing) {
        logger.debug(`[NewsScraper] Article already exists: ${article.title}`);
        return null;
      }

      const saved = await prisma.news.create({
        data: {
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          imageUrl: article.imageUrl,
          author: article.author,
          category: article.category,
          slug: slug,
          isPublished: false,
          isFeatured: false,
          isCopyProtected: false,
          sourceType: 'auto',
          sourceName: article.sourceName,
          sourceUrl: article.sourceUrl,
          scrapedAt: new Date(),
          keywords: this.extractKeywords(article),
          language: article.language,
          originalId: article.originalId,
        },
      });

      logger.info(`[NewsScraper] Saved new article: ${saved.title}`);
      return saved;
    } catch (error) {
      logger.error(`[NewsScraper] Failed to save article:`, error);
      return null;
    }
  }

  private extractKeywords(article: ScrapedArticle): string[] {
    const text = `${article.title} ${article.content} ${article.category}`.toLowerCase();
    const words = text.match(/[a-zàâäéèêëîïôöùûüÿçœæ]+/g) || [];
    
    const stopWords = new Set([
      'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'mais', 'dans', 'pour',
      'par', 'sur', 'avec', 'sans', 'en', 'à', 'au', 'aux', 'ce', 'cet', 'cette', 'ces',
      'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'for', 'on', 'with', 'without', 'to', 'of',
    ]);

    const wordCount = new Map<string, number>();
    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }

    return Array.from(wordCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([word]) => word);
  }

  async scrapeAllSources(): Promise<{ total: number; saved: number }> {
    const sources = getEnabledSources();
    let totalArticles = 0;
    let savedArticles = 0;

    logger.info(`[NewsScraper] Starting scrape of ${sources.length} sources`);

    for (const source of sources) {
      try {
        let articles: ScrapedArticle[] = [];
        
        if (source.type === 'rss') {
          articles = await this.scrapeRSS(source);
        } else if (source.type === 'web') {
          articles = await this.scrapeWeb(source);
        }

        totalArticles += articles.length;

        for (const article of articles.slice(0, 10)) { // Limit to 10 per source to prevent overload
          const saved = await this.saveArticle(article);
          if (saved) savedArticles++;
        }
      } catch (error) {
        logger.error(`[NewsScraper] Error processing source ${source.name}:`, error);
      }
    }

    logger.info(`[NewsScraper] Scrape complete: ${savedArticles}/${totalArticles} articles saved`);
    return { total: totalArticles, saved: savedArticles };
  }

  async getSourceStats() {
    const stats = await prisma.news.groupBy({
      by: ['sourceName', 'sourceType'],
      _count: { id: true },
    });
    return stats;
  }
}

export const newsScraper = new NewsScraperService();
