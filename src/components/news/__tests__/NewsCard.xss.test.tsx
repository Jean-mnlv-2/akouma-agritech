import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NewsCard } from '../NewsCard';

/**
 * Non-regression tests: any admin-authored HTML rendered via
 * dangerouslySetInnerHTML on public pages MUST go through DOMPurify.
 * These tests fail if a future refactor drops the sanitizer.
 */
describe('NewsCard XSS sanitization', () => {
  const baseItem = {
    id: '1',
    slug: 'test',
    title: 'Test article',
    author: 'KILIMO',
    image: '/img.png',
    date: '2026-07-16T10:00:00Z',
    category: 'Agriculture',
    read_time: 3,
  };

  function renderCard(excerpt: string) {
    return render(
      <MemoryRouter>
        <NewsCard
          item={{ ...baseItem, excerpt }}
          readMoreLabel="Lire"
          readTimeLabel="min"
        />
      </MemoryRouter>
    );
  }

  it('strips <script> tags from excerpt HTML', () => {
    const { container } = renderCard(
      '<p>Safe text</p><script>window.__xss = true;</script>'
    );
    expect(container.querySelector('script')).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).__xss).toBeUndefined();
    expect(container.innerHTML).not.toContain('<script');
    expect(screen.getByText('Safe text')).toBeInTheDocument();
  });

  it('strips inline event handlers like onerror on images', () => {
    const { container } = renderCard(
      '<img src="x" onerror="window.__xss2=true" alt="bad" />'
    );
    const img = container.querySelector('img[alt="bad"]');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('onerror')).toBeNull();
    expect(container.innerHTML).not.toMatch(/onerror\s*=/i);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((window as any).__xss2).toBeUndefined();
  });

  it('strips javascript: URLs from anchors', () => {
    const { container } = renderCard(
      '<a href="javascript:alert(1)">Cliquer</a>'
    );
    const link = container.querySelector('a');
    if (link) {
      const href = link.getAttribute('href') || '';
      expect(href.toLowerCase()).not.toMatch(/^javascript:/);
    }
  });
});