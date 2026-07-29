import Parser from 'rss-parser';
import { News, NewsSource } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';
import { slugify } from '../utils/slugify';
import { prisma } from '../db';

const USER_AGENT = 'KilimoAgritechBot/1.0 (+https://kilimo-agritech.com; veille agricole automatisee)';
const FETCH_TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 800;
const SCRAPE_CONCURRENCY = 3;

const rssParser = new Parser();

export interface ScrapedArticle {
  title: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  author: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  language: string;
  publishedAt: Date | null;
  originalId: string | null;
}

export interface SourceScrapeResult {
  sourceId: number;
  sourceName: string;
  type: string;
  status: 'ok' | 'not_modified' | 'error';
  found: number;
  saved: number;
  skipped?: number;
  error?: string;
  durationMs: number;
}

export interface SourceTestResult {
  ok: boolean;
  articlesFound: number;
  sample: { title: string; sourceUrl: string }[];
  error?: string;
}

interface RawFeedCacheEntry {
  etag?: string;
  lastModified?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class NewsScraperService {
  // Articles déjà parsés, par source — sert de secours (dernière version
  // connue) si une source répond 304 Not Modified ou échoue temporairement.
  private cache = new Map<number, { data: ScrapedArticle[]; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 60 * 1000;

  // ETag/Last-Modified par source, pour le GET conditionnel — évite de
  // re-télécharger et re-parser un flux qui n'a pas changé (politesse
  // réseau envers les sources, et scraping plus rapide). Optimisation
  // en mémoire uniquement : perdue au redémarrage, sans impact sur la
  // correction (juste une requête complète de plus).
  private rawFeedCache = new Map<number, RawFeedCacheEntry>();

  constructor() {
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

  private setCache(sourceId: number, data: ScrapedArticle[]): void {
    this.cache.set(sourceId, { data, timestamp: Date.now() });
  }

  private getCache(sourceId: number): ScrapedArticle[] | null {
    const cached = this.cache.get(sourceId);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(sourceId);
      return null;
    }
    return cached.data;
  }

  /**
   * Persiste la santé directement sur la ligne NewsSource — survit aux
   * redémarrages, contrairement à un cache en mémoire, et c'est ce que
   * l'admin/DeerFlow consultent via GET .../status.
   */
  private async recordHealth(sourceId: number, status: 'ok' | 'not_modified' | 'error', articleCount: number, error?: string) {
    try {
      const current = await prisma.newsSource.findUnique({ where: { id: sourceId }, select: { consecutiveFailures: true } });
      await prisma.newsSource.update({
        where: { id: sourceId },
        data: {
          lastStatus: status,
          lastError: status === 'error' ? (error || 'unknown_error') : null,
          lastRunAt: new Date(),
          ...(status !== 'error' && { lastArticleCount: articleCount }),
          consecutiveFailures: status === 'error' ? (current?.consecutiveFailures || 0) + 1 : 0,
        },
      });
    } catch (e) {
      logger.error(`[NewsScraper] Failed to record health for source ${sourceId}:`, e);
    }
  }

  /**
   * GET avec retry (1x, backoff court) sur erreur réseau/5xx uniquement —
   * une 4xx (source mal configurée) échoue immédiatement, pas la peine de
   * réessayer. `validateStatus` accepte 304 (GET conditionnel) sans lever.
   */
  private async fetchWithRetry(url: string, headers: Record<string, string>) {
    let lastError: any;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await axios.get(url, {
          headers,
          timeout: FETCH_TIMEOUT_MS,
          responseType: 'text',
          transformResponse: (data) => data, // garder le XML/HTML brut, pas de parsing JSON auto
          validateStatus: (status) => status === 200 || status === 304,
        });
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        const isClientError = status && status >= 400 && status < 500;
        if (isClientError || attempt === MAX_RETRIES) break;
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
    throw lastError;
  }

  async scrapeRSS(source: NewsSource): Promise<ScrapedArticle[]> {
    const cached = this.getCache(source.id);
    const raw = this.rawFeedCache.get(source.id);

    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
      Accept: 'application/rss+xml, application/atom+xml, application/rdf+xml, application/xml, text/xml',
    };
    if (raw?.etag) headers['If-None-Match'] = raw.etag;
    if (raw?.lastModified) headers['If-Modified-Since'] = raw.lastModified;

    try {
      logger.info(`[NewsScraper] Scraping RSS: ${source.name} (${source.url})`);
      const response = await this.fetchWithRetry(source.url, headers);

      if (response.status === 304 && cached) {
        logger.debug(`[NewsScraper] ${source.name}: 304 Not Modified, using cached data`);
        await this.recordHealth(source.id, 'not_modified', cached.length);
        return cached;
      }

      const feed = await rssParser.parseString(response.data);
      const articles: ScrapedArticle[] = [];
      for (const item of feed.items) {
        try {
          const article = this.parseRSSItem(item as any, source);
          if (article) articles.push(article);
        } catch (error) {
          logger.warn(`[NewsScraper] Failed to parse item from ${source.name}:`, error);
        }
      }

      this.setCache(source.id, articles);
      const etag = response.headers?.etag;
      const lastModified = response.headers?.['last-modified'];
      if (etag || lastModified) {
        this.rawFeedCache.set(source.id, { etag, lastModified });
      }
      await this.recordHealth(source.id, 'ok', articles.length);
      logger.info(`[NewsScraper] Successfully scraped ${articles.length} articles from ${source.name}`);
      return articles;
    } catch (error: any) {
      const message = error?.response?.status
        ? `HTTP ${error.response.status}`
        : (error?.message || 'unknown_error');
      logger.error(`[NewsScraper] Failed to scrape RSS ${source.name}: ${message}`);
      await this.recordHealth(source.id, 'error', 0, message);
      // Dégradation gracieuse : renvoyer la dernière version connue plutôt
      // que rien, si une exécution précédente a réussi.
      return cached || [];
    }
  }

  async scrapeWeb(source: NewsSource): Promise<ScrapedArticle[]> {
    const cached = this.getCache(source.id);

    try {
      logger.info(`[NewsScraper] Scraping web: ${source.name} (${source.url})`);

      const response = await this.fetchWithRetry(source.url, {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      });

      const $ = cheerio.load(response.data);
      const articles = this.parseWebPage($, source);

      // Une source "événement" peut être soit une page calendrier qui liste
      // plusieurs événements (les liens extraits par parseWebPage couvrent
      // ce cas), soit le site dédié d'un seul événement (le JSON-LD décrit
      // alors la page elle-même, pas une page liée) — ex: le site officiel
      // d'un salon professionnel. On vérifie donc aussi la page chargée
      // elle-même, sans refetch supplémentaire puisque $ est déjà en main.
      if (source.contentType === 'event') {
        const selfCandidate = this.selfPageAsEventCandidate($, source);
        if (selfCandidate) articles.unshift(selfCandidate);
      }

      this.setCache(source.id, articles);
      await this.recordHealth(source.id, 'ok', articles.length);
      logger.info(`[NewsScraper] Successfully scraped ${articles.length} articles from ${source.name}`);
      return articles;
    } catch (error: any) {
      const message = error?.response?.status
        ? `HTTP ${error.response.status}`
        : (error?.message || 'unknown_error');
      logger.error(`[NewsScraper] Failed to scrape web ${source.name}: ${message}`);
      await this.recordHealth(source.id, 'error', 0, message);
      return cached || [];
    }
  }

  /**
   * Fetch + parse à blanc, sans toucher au cache ni à la santé persistée —
   * utilisé par l'UI admin pour "Tester la source" avant d'autoriser
   * l'enregistrement (garde-fou contre une URL cassée/mal configurée).
   */
  async testSource(url: string, type: 'rss' | 'web', contentType: 'news' | 'event' = 'news'): Promise<SourceTestResult> {
    const pseudoSource = { id: 0, name: 'test', url, type, language: 'fr', category: 'Test', enabled: true } as unknown as NewsSource;
    try {
      let articles: ScrapedArticle[];
      if (type === 'rss') {
        const response = await this.fetchWithRetry(url, {
          'User-Agent': USER_AGENT,
          Accept: 'application/rss+xml, application/atom+xml, application/rdf+xml, application/xml, text/xml',
        });
        const feed = await rssParser.parseString(response.data);
        articles = feed.items
          .map((item) => this.parseRSSItem(item as any, pseudoSource))
          .filter((a): a is ScrapedArticle => !!a);
      } else {
        const response = await this.fetchWithRetry(url, {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
        });
        const $ = cheerio.load(response.data);
        articles = this.parseWebPage($, pseudoSource);
        if (contentType === 'event') {
          const selfCandidate = this.selfPageAsEventCandidate($, pseudoSource);
          if (selfCandidate) articles.unshift(selfCandidate);
        }
      }

      if (articles.length === 0) {
        return { ok: false, articlesFound: 0, sample: [], error: "Aucun article détecté (flux vide ou structure de page non reconnue)" };
      }

      // Pour une source "événement", trouver des candidats ne suffit pas :
      // seuls ceux dont la page expose des données structurées Schema.org
      // deviendront un jour un vrai événement (voir saveEventFromArticle).
      // Le test doit donc vérifier ça, pas juste "des liens ont été trouvés".
      if (contentType === 'event') {
        const sampleToCheck = articles.slice(0, 3);
        let structuredCount = 0;
        for (const article of sampleToCheck) {
          try {
            const pageResponse = await this.fetchWithRetry(article.sourceUrl, {
              'User-Agent': USER_AGENT,
              Accept: 'text/html,application/xhtml+xml',
            });
            const page$ = cheerio.load(pageResponse.data);
            if (this.extractJsonLdEvent(page$)) structuredCount++;
          } catch {
            // ignorer — comptera comme non structuré
          }
        }
        return {
          ok: structuredCount > 0,
          articlesFound: articles.length,
          sample: sampleToCheck.map((a) => ({ title: a.title, sourceUrl: a.sourceUrl })),
          error: structuredCount === 0
            ? `${articles.length} lien(s) détecté(s), mais aucun ne contient de données d'événement structurées (Schema.org). Cette source ne produira jamais d'événement automatiquement — DeerFlow (navigation + raisonnement) reste nécessaire pour ce site.`
            : undefined,
        };
      }

      return {
        ok: true,
        articlesFound: articles.length,
        sample: articles.slice(0, 3).map((a) => ({ title: a.title, sourceUrl: a.sourceUrl })),
      };
    } catch (error: any) {
      const message = error?.response?.status ? `HTTP ${error.response.status}` : (error?.message || 'unknown_error');
      return { ok: false, articlesFound: 0, sample: [], error: message };
    }
  }

  private parseRSSItem(item: Parser.Item & { creator?: string; author?: string }, source: NewsSource): ScrapedArticle | null {
    if (!item.title || !item.link) {
      return null;
    }

    const content = item.contentSnippet || item.content || item.title;
    const cleanedContent = this.cleanHTML(content);
    // Toujours un résumé tronqué du contenu, jamais le texte intégral
    // recopié tel quel — beaucoup de flux RSS (AllAfrica notamment) n'ont
    // qu'un court résumé en guise de "contenu", donc réutiliser
    // `contentSnippet` verbatim pour l'extrait produisait un extrait
    // identique au contenu. `enrichArticle()` recalculera un extrait plus
    // pertinent si le contenu complet est récupéré depuis la page source.
    const excerpt = this.createExcerpt(cleanedContent, 200);

    return {
      title: this.decodeEntities(item.title),
      content: cleanedContent,
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

    // More comprehensive list of selectors for different site structures
    const selectors = [
      'article',
      '.post',
      '.news-item',
      '.article-item',
      '.item',
      '.card',
      '.blog-post',
      '.entry',
      'li.article',
      'div.article',
      '.list-item',
      '.post-item',
    ];

    // Try each selector until we find articles
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((_, element) => {
          const $el = $(element);

          // Try multiple selectors for title
          const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.post-title', '.entry-title', 'a'];
          let title = '';
          for (const sel of titleSelectors) {
            const text = $el.find(sel).first().text().trim();
            if (text && text.length > 10) {
              title = text;
              break;
            }
          }

          // Try multiple selectors for link
          const linkSelectors = ['a', '.read-more', '.more-link', 'h2 a', 'h3 a'];
          let link = '';
          for (const sel of linkSelectors) {
            const href = $el.find(sel).first().attr('href');
            if (href) {
              link = href;
              break;
            }
          }

          if (!title || title.length < 10 || !link) return;

          // Try multiple selectors for content
          const contentSelectors = ['.content', '.excerpt', '.post-content', '.entry-content', 'p', '.description'];
          let content = title;
          for (const sel of contentSelectors) {
            const text = $el.find(sel).first().text().trim();
            if (text && text.length > 50) {
              content = text;
              break;
            }
          }

          // Try multiple selectors for image
          const imageSelectors = ['img', '.image img', '.thumbnail img', '.post-thumbnail img', 'figure img'];
          let imageUrl: string | null = null;
          for (const sel of imageSelectors) {
            const src = $el.find(sel).first().attr('src') || $el.find(sel).first().attr('data-src');
            if (src) {
              imageUrl = this.resolveUrl(src, source.url);
              break;
            }
          }

          articles.push({
            title,
            content: this.cleanHTML(content),
            excerpt: this.createExcerpt(content),
            imageUrl,
            author: source.name,
            category: source.category,
            sourceName: source.name,
            sourceUrl: this.resolveUrl(link, source.url),
            language: source.language,
            publishedAt: null,
            originalId: link,
          });
        });
        break; // Stop after finding a working selector
      }
    }

    // Fallback: try to find all links with titles
    if (articles.length === 0) {
      $('a').each((_, element) => {
        const $el = $(element);
        const title = $el.text().trim();
        const link = $el.attr('href');

        if (title && title.length > 15 && link && !link.includes('#')) {
          articles.push({
            title,
            content: title,
            excerpt: title,
            imageUrl: null,
            author: source.name,
            category: source.category,
            sourceName: source.name,
            sourceUrl: this.resolveUrl(link, source.url),
            language: source.language,
            publishedAt: null,
            originalId: link,
          });
        }
      });
    }

    return articles.slice(0, 20);
  }

  /**
   * Beaucoup de flux RSS (AllAfrica notamment) n'exposent qu'un court
   * résumé, pas l'article complet ni d'image — ce que `parseRSSItem` capture
   * tel quel produit des brouillons trop courts et sans visuel. Cette étape
   * va chercher l'article original (`article.sourceUrl`) pour en extraire
   * un texte plus complet et une image de couverture réelle (`og:image`,
   * standard sur la quasi-totalité des sites d'actualités modernes — bien
   * plus fiable qu'un devinage de sélecteurs CSS). N'est appelée que pour
   * les articles réellement nouveaux (après la vérification de doublon dans
   * `saveArticle`), jamais pour un article déjà en base — évite de refaire
   * cette requête coûteuse à chaque scrape.
   */
  private async enrichArticle(article: ScrapedArticle): Promise<ScrapedArticle> {
    const needsContent = article.content.length < 600;
    const needsImage = !article.imageUrl;
    if (!needsContent && !needsImage) return article;

    try {
      const response = await this.fetchWithRetry(article.sourceUrl, {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      });
      const $ = cheerio.load(response.data);

      let imageUrl = article.imageUrl;
      if (needsImage) {
        const og = $('meta[property="og:image"]').attr('content')
          || $('meta[name="twitter:image"]').attr('content')
          || $('meta[property="og:image:url"]').attr('content');
        if (og) imageUrl = this.resolveUrl(og, article.sourceUrl);
      }

      let content = article.content;
      let excerpt = article.excerpt;
      if (needsContent) {
        const bodySelectors = [
          'article', '.article-content', '.entry-content', '.post-content',
          '.story-body', '.content-article', '.article-body', 'main',
        ];
        let bestText = '';
        for (const sel of bodySelectors) {
          const text = $(sel).first().text().trim();
          if (text.length > bestText.length) bestText = text;
        }
        const cleaned = this.decodeEntities(this.cleanHTML(bestText));
        // Ne remplace que si on a trouvé quelque chose de réellement plus
        // riche que le résumé RSS — sinon on garde le résumé d'origine
        // plutôt qu'un texte de navigation/pub mal extrait.
        if (cleaned.length > content.length + 200) {
          content = cleaned.slice(0, 20000);
          excerpt = this.createExcerpt(content, 200);
        }
      }

      return { ...article, content, excerpt, imageUrl };
    } catch (error) {
      logger.warn(`[NewsScraper] Enrichment failed for ${article.sourceUrl}, keeping RSS snippet:`, error);
      return article; // dégradation gracieuse : le brouillon reste utilisable, juste plus succinct
    }
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
    return this.decodeEntities(
      html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    ).trim();
  }

  /**
   * Décode les entités HTML nommées courantes ET numériques
   * (&#xE9; / &#233; -> é) — les flux RSS (notamment AllAfrica) renvoient
   * des titres avec des entités numériques que `cleanHTML` seul laissait
   * passer telles quelles (ex: "S&#xE9;n&#xE9;gal" au lieu de "Sénégal").
   */
  private decodeEntities(text: string): string {
    return text
      .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'");
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

      // Enrichissement (contenu complet + image de couverture depuis la page
      // source) uniquement pour les articles réellement nouveaux — jamais
      // gaspillé sur un doublon déjà écarté ci-dessus.
      const enriched = await this.enrichArticle(article);

      const saved = await prisma.news.create({
        data: {
          title: enriched.title,
          content: enriched.content,
          excerpt: enriched.excerpt,
          imageUrl: enriched.imageUrl,
          author: enriched.author,
          category: enriched.category,
          slug: slug,
          isPublished: false,
          isFeatured: false,
          isCopyProtected: false,
          sourceType: 'auto',
          sourceName: enriched.sourceName,
          sourceUrl: enriched.sourceUrl,
          scrapedAt: new Date(),
          keywords: this.extractKeywords(enriched),
          language: enriched.language,
          originalId: enriched.originalId,
        },
      });

      logger.info(`[NewsScraper] Saved new article: ${saved.title}`);
      return saved;
    } catch (error) {
      logger.error(`[NewsScraper] Failed to save article:`, error);
      return null;
    }
  }

  /**
   * Point d'entrée unique pour la sauvegarde d'un candidat scrapé, quel que
   * soit le type de contenu de la source — c'est ce que `scrapeAllSources()`
   * et les routes "scraper une seule source" appellent, pour ne jamais
   * avoir à dupliquer la logique de branchement news/event à chaque site
   * d'appel.
   */
  async saveScrapedItem(article: ScrapedArticle, source: NewsSource): Promise<{ saved: boolean; skippedReason?: string }> {
    if (source.contentType === 'event') {
      return this.saveEventFromArticle(article);
    }
    const saved = await this.saveArticle(article);
    return { saved: !!saved };
  }

  /**
   * Contrairement aux actualités, un événement a des champs obligatoires
   * (date, lieu) qu'un flux RSS/une page listing générique ne fournit
   * presque jamais correctement — les deviner produirait de fausses
   * informations affichées publiquement. On ne crée un événement QUE si la
   * page source expose des données structurées Schema.org
   * (`<script type="application/ld+json">`, `@type: "Event"`), le standard
   * qu'utilisent réellement les sites d'événements/billetterie modernes.
   * Sans ça, le candidat est silencieusement écarté (santé de la source
   * reflète quand même le nombre trouvé vs. réellement créé) — c'est
   * DeerFlow (raisonnement + navigation) qui reste responsable des sources
   * sans données structurées, pas ce moteur déterministe.
   */
  private async saveEventFromArticle(article: ScrapedArticle): Promise<{ saved: boolean; skippedReason?: string }> {
    const slug = slugify(article.title);
    const existing = await prisma.event.findFirst({
      where: { OR: [{ slug: { startsWith: slug } }, { title: article.title }] },
    });
    if (existing) {
      logger.debug(`[NewsScraper] Event candidate already exists: ${article.title}`);
      return { saved: false, skippedReason: 'duplicate' };
    }

    try {
      const response = await this.fetchWithRetry(article.sourceUrl, {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      });
      const $ = cheerio.load(response.data);
      const eventData = this.extractJsonLdEvent($);

      if (!eventData) {
        logger.info(`[NewsScraper] Skipped event candidate (no structured Schema.org date/location found): ${article.title}`);
        return { saved: false, skippedReason: 'no_structured_data' };
      }

      // Deuxième vérification de doublon, APRÈS extraction : plusieurs
      // candidats (des pages différentes du même site) peuvent partager le
      // même JSON-LD (ex: bandeau/pied de page commun à tout le site) et
      // n'auraient pas été détectés par le premier contrôle, qui ne
      // connaissait que le titre brut du lien scrapé — pas le vrai titre/
      // date/lieu de l'événement. La date+lieu exacts sont le signal fiable
      // qu'il s'agit du même événement réel, même si le titre diffère
      // légèrement.
      const realTitle = this.decodeEntities(eventData.title || article.title);
      const realSlug = slugify(realTitle);
      const duplicateAfterExtraction = await prisma.event.findFirst({
        where: {
          OR: [
            { slug: { startsWith: realSlug } },
            { AND: [{ date: eventData.date }, { location: eventData.location }] },
          ],
        },
      });
      if (duplicateAfterExtraction) {
        logger.debug(`[NewsScraper] Event candidate resolved to an already-known event, skipping: ${realTitle}`);
        return { saved: false, skippedReason: 'duplicate' };
      }

      let finalSlug = realSlug;
      const baseSlug = finalSlug;
      let counter = 1;
      while (await prisma.event.findUnique({ where: { slug: finalSlug } })) {
        counter++;
        finalSlug = `${baseSlug}-${counter}`;
      }

      const og = $('meta[property="og:image"]').attr('content');
      const imageUrl = eventData.imageUrl
        ? this.resolveUrl(eventData.imageUrl, article.sourceUrl)
        : (og ? this.resolveUrl(og, article.sourceUrl) : article.imageUrl);

      await prisma.event.create({
        data: {
          title: this.decodeEntities(eventData.title || article.title),
          description: eventData.description
            ? this.decodeEntities(eventData.description)
            : (article.excerpt || article.content || null),
          date: eventData.date,
          location: eventData.location,
          imageUrl,
          slug: finalSlug,
          isPublished: false,
        } as any,
      });
      logger.info(`[NewsScraper] Saved new event: ${article.title} (${eventData.date.toISOString()} — ${eventData.location})`);
      return { saved: true };
    } catch (error) {
      logger.warn(`[NewsScraper] Event enrichment failed for ${article.sourceUrl}, skipping:`, error);
      return { saved: false, skippedReason: 'fetch_failed' };
    }
  }

  /**
   * Cherche un bloc JSON-LD Schema.org `@type: "Event"` (ou `@graph` en
   * contenant un) dans la page. Exige `startDate` (date parsable) ET
   * `location` (nom ou adresse) — un événement sans l'un des deux n'est pas
   * assez fiable pour être publié tel quel.
   */
  private extractJsonLdEvent($: cheerio.CheerioAPI): { date: Date; location: string; title?: string; description?: string; imageUrl?: string } | null {
    const scripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      const raw = $(scripts[i]).contents().text();
      if (!raw) continue;

      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }

      const candidates: any[] = [];
      const collect = (node: any) => {
        if (!node) return;
        if (Array.isArray(node)) { node.forEach(collect); return; }
        if (node['@graph']) { collect(node['@graph']); return; }
        candidates.push(node);
      };
      collect(parsed);

      for (const node of candidates) {
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        if (!types.some((t: unknown) => typeof t === 'string' && t.toLowerCase() === 'event')) continue;

        const startDate = node.startDate ? new Date(node.startDate) : null;
        if (!startDate || isNaN(startDate.getTime())) continue;

        let location = '';
        const loc = node.location;
        if (typeof loc === 'string') {
          location = loc;
        } else if (loc?.name) {
          location = loc.name;
        } else if (loc?.address) {
          const addr = loc.address;
          location = typeof addr === 'string'
            ? addr
            : [addr.streetAddress, addr.addressLocality, addr.addressCountry].filter(Boolean).join(', ');
        }
        if (!location) continue;

        const imageRaw = Array.isArray(node.image) ? node.image[0] : node.image;
        const imageUrl = typeof imageRaw === 'string' ? imageRaw : imageRaw?.url;

        return {
          date: startDate,
          location,
          title: typeof node.name === 'string' ? node.name : undefined,
          description: typeof node.description === 'string' ? node.description : undefined,
          imageUrl,
        };
      }
    }
    return null;
  }

  /**
   * Représente la page elle-même comme candidat "article" si elle porte du
   * JSON-LD Event — cas du site dédié d'un seul événement (ex: le site
   * officiel d'un salon), où il n'y a aucun lien à extraire, juste la page
   * chargée qui EST l'événement. `saveEventFromArticle` re-fetchera
   * `sourceUrl` pour l'extraction finale (source de vérité unique), ce
   * candidat sert seulement à ce que la page soit prise en compte comme un
   * élément détecté par `parseWebPage`/`testSource`.
   */
  private selfPageAsEventCandidate($: cheerio.CheerioAPI, source: NewsSource): ScrapedArticle | null {
    const eventData = this.extractJsonLdEvent($);
    if (!eventData) return null;
    const title = eventData.title || $('title').first().text().trim() || source.name;
    return {
      title,
      content: eventData.description || '',
      excerpt: eventData.description ? this.createExcerpt(eventData.description, 200) : null,
      imageUrl: eventData.imageUrl ? this.resolveUrl(eventData.imageUrl, source.url) : null,
      author: source.name,
      category: source.category,
      sourceName: source.name,
      sourceUrl: source.url,
      language: source.language,
      publishedAt: null,
      originalId: source.url,
    };
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

  /**
   * Scrape toutes les sources activées (lues depuis la table NewsSource)
   * avec une concurrence bornée (au lieu d'un traitement séquentiel) — plus
   * rapide sans pour autant envoyer SCRAPE_CONCURRENCY+1 requêtes
   * simultanées à une même source. Chaque source échoue indépendamment :
   * une source en panne ne bloque jamais les autres.
   */
  async scrapeAllSources(): Promise<{ total: number; saved: number; sources: SourceScrapeResult[] }> {
    const sources = await prisma.newsSource.findMany({ where: { enabled: true } });
    const results: SourceScrapeResult[] = [];
    let cursor = 0;

    logger.info(`[NewsScraper] Starting scrape of ${sources.length} sources (concurrency=${SCRAPE_CONCURRENCY})`);

    const worker = async () => {
      while (cursor < sources.length) {
        const source = sources[cursor++];
        const start = Date.now();
        try {
          const articles = source.type === 'rss'
            ? await this.scrapeRSS(source)
            : await this.scrapeWeb(source);

          let saved = 0;
          let skipped = 0;
          for (const article of articles.slice(0, 10)) { // Limit to 10 per source to prevent overload
            const result = await this.saveScrapedItem(article, source);
            if (result.saved) saved++;
            else if (result.skippedReason && result.skippedReason !== 'duplicate') skipped++;
          }

          const refreshed = await prisma.newsSource.findUnique({ where: { id: source.id }, select: { lastStatus: true } });
          results.push({
            sourceId: source.id,
            sourceName: source.name,
            type: source.type,
            status: (refreshed?.lastStatus as SourceScrapeResult['status']) || 'ok',
            found: articles.length,
            saved,
            skipped,
            durationMs: Date.now() - start,
          });
        } catch (error) {
          logger.error(`[NewsScraper] Error processing source ${source.name}:`, error);
          results.push({
            sourceId: source.id,
            sourceName: source.name,
            type: source.type,
            status: 'error',
            found: 0,
            saved: 0,
            error: error instanceof Error ? error.message : 'unknown_error',
            durationMs: Date.now() - start,
          });
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(SCRAPE_CONCURRENCY, sources.length) }, worker));

    const total = results.reduce((sum, r) => sum + r.found, 0);
    const saved = results.reduce((sum, r) => sum + r.saved, 0);
    logger.info(`[NewsScraper] Scrape complete: ${saved}/${total} articles saved across ${results.length} sources`);
    return { total, saved, sources: results };
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
