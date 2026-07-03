import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewsScraperService } from '../../src/services/newsScraperService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    news: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mockPrisma) };
});

// Mock rss-parser
vi.mock('rss-parser', () => ({
  default: vi.fn(() => ({
    parseURL: vi.fn(),
  })),
}));

describe('NewsScraperService', () => {
  let service: NewsScraperService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NewsScraperService();
  });

  describe('cleanHTML', () => {
    it('should remove HTML tags from text', () => {
      const result = service['cleanHTML']('<p>Hello <strong>world</strong></p>');
      expect(result).toBe('Hello world');
    });

    it('should handle multiple spaces', () => {
      const result = service['cleanHTML']('  Hello   world  ');
      expect(result).toBe('Hello world');
    });

    it('should handle HTML entities', () => {
      const result = service['cleanHTML']('&lt;p&gt;Hello &amp; welcome&lt;/p&gt;');
      expect(result).toBe('<p>Hello & welcome</p>');
    });
  });

  describe('createExcerpt', () => {
    it('should create excerpt from long text', () => {
      const longText = 'a'.repeat(300);
      const result = service['createExcerpt'](longText);
      expect(result.length).toBeLessThanOrEqual(203); // 200 + ...
      expect(result.endsWith('...')).toBe(true);
    });

    it('should return full text if short enough', () => {
      const shortText = 'Hello world';
      const result = service['createExcerpt'](shortText);
      expect(result).toBe(shortText);
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from text', () => {
      const article = {
        title: 'Agriculture durable en Afrique',
        content: 'L\'agriculture durable est essentielle pour le développement de l\'Afrique. Les techniques agricoles modernes améliorent les rendements.',
        author: 'Test',
        category: 'Agriculture',
        sourceName: 'Test Source',
        sourceUrl: 'http://example.com',
        language: 'fr' as const,
        publishedAt: null,
        originalId: null,
        excerpt: null,
        imageUrl: null,
      };
      
      const keywords = service['extractKeywords'](article);
      expect(Array.isArray(keywords)).toBe(true);
    });
  });

  describe('resolveUrl', () => {
    it('should return absolute URL as-is', () => {
      const result = service['resolveUrl']('https://example.com/article', 'https://example.com');
      expect(result).toBe('https://example.com/article');
    });

    it('should resolve relative URLs', () => {
      const result = service['resolveUrl']('/article', 'https://example.com');
      expect(result).toBe('https://example.com/article');
    });
  });
});
