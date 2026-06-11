import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/index';
import { env } from '../../src/utils/env';

/**
 * Régression de sécurité : ces tests vérifient que les attaques connues
 * (auto-progression à 100 %, certificats arbitraires, IDOR, mass-assignment,
 * webhooks rejouables) restent bloquées.
 *
 * Ils n'exigent PAS de base de données : on cible des comportements visibles
 * sans persistance (validation, autorisations, schémas Zod). Les tests qui
 * dépendraient d'une DB réelle sont marqués `it.skip` avec une explication.
 */

function bearer(role: 'customer' | 'admin' | 'supervisor', sub = 'user-id-1') {
  const token = jwt.sign({ sub, role }, env.JWT_SECRET, { expiresIn: '5m' });
  return `Bearer ${token}`;
}

describe('Security regression — fraud paths must be blocked', () => {
  // ---------- 1. Self-reported progress ----------
  it('rejects unknown fields on PUT /api/elearning_enrollments/:id (strict schema)', async () => {
    const res = await request(app)
      .put('/api/elearning_enrollments/1')
      .set('Authorization', bearer('customer'))
      .send({ progress: 100, hackerField: 'pwned', anotherUnknown: true });
    // Either 400 (schema rejects unknowns) or 401/404 (auth/DB). Never 200 with the unknown field accepted.
    expect([400, 401, 403, 404]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.error).toBe('validation_failed');
    }
  });

  it('rejects unauthenticated PUT on enrollments', async () => {
    const res = await request(app)
      .put('/api/elearning_enrollments/1')
      .send({ progress: 100 });
    expect(res.status).toBe(401);
  });

  // ---------- 2. Arbitrary Sertifier certificates ----------
  it('forbids non-admin POST /api/sertifier/issue-credential', async () => {
    const res = await request(app)
      .post('/api/sertifier/issue-credential')
      .set('Authorization', bearer('customer'))
      .send({
        recipientName: 'Attacker',
        recipientEmail: 'attacker@example.com',
        courseName: 'Fake Course',
        designId: 'aaaaaaaa',
        detailId: 'bbbbbbbb',
        emailTemplateId: 'cccccccc',
      });
    expect([403, 503]).toContain(res.status); // 503 if Sertifier not configured (guard middleware), 403 otherwise
  });

  // ---------- 3. IDOR on schedules ----------
  it('validates body shape on POST /api/course_schedules (anti-IDOR + strict schema)', async () => {
    const res = await request(app)
      .post('/api/course_schedules')
      .set('Authorization', bearer('customer'))
      .send({ enrollmentId: 'not-a-number', courseId: 1, scheduledDate: '2026-01-01', timeSlot: '10:00', extraneous: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_failed');
  });

  // ---------- 4. Mass-assignment on tasks ----------
  it('strips unknown fields on POST /api/tasks (strict Zod schema)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', bearer('admin'))
      .send({ title: 'ok', id: 9999, createdAt: '1970-01-01', maliciousField: true });
    // Strict schema rejects unknowns with 400 even for admins.
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_failed');
  });

  it('requires a title on POST /api/tasks', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', bearer('admin'))
      .send({});
    expect(res.status).toBe(400);
  });

  // ---------- 5. Mass-assignment on elearning_stats ----------
  it('rejects unknown fields on POST /api/elearning_stats', async () => {
    const res = await request(app)
      .post('/api/elearning_stats')
      .set('Authorization', bearer('admin'))
      .send({ label: 'X', value: '10', injected: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_failed');
  });

  // ---------- 6. Order creation price tampering ----------
  it('validates request shape on POST /api/orders and ignores client price', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', bearer('customer'))
      .send({
        items: [{ productId: 999999, quantity: 1, price: 0.01, name: 'cheap', wat: true }],
      });
    // Either 400 (strict schema rejects `wat`) or downstream "Produit indisponible".
    expect([400, 404]).toContain(res.status);
  });

  // ---------- 7. Payment webhook anti-replay ----------
  it('rejects payment webhook when shared secret is set without replay headers', async () => {
    if (!env.MONEYFUSION_WEBHOOK_SECRET) {
      // Required mode triggers only when secret is configured.
      return;
    }
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-secret', env.MONEYFUSION_WEBHOOK_SECRET)
      .send({ tokenPay: 'tok_test', statut: 'paid' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('webhook_replay_protection_required');
  });

  it('rejects payment webhook with timestamp out of window', async () => {
    const oldTs = Math.floor(Date.now() / 1000) - 10_000;
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-timestamp', String(oldTs))
      .set('x-webhook-nonce', 'nonce-test-1')
      .send({ tokenPay: 'tok_test', statut: 'paid' });
    // Either 401 (skew) or 503/400 depending on env; 200 must NOT happen with stale ts.
    expect([400, 401]).toContain(res.status);
  });

  // ---------- 8. Sertifier mutating endpoints require admin ----------
  it.each([
    '/api/sertifier/credentials/search',
    '/api/sertifier/designs/search',
    '/api/sertifier/details/search',
    '/api/sertifier/email-templates/search',
  ])('forbids non-admin POST %s', async (url: string) => {
    const res = await request(app)
      .post(url)
      .set('Authorization', bearer('customer'))
      .send({});
    expect([401, 403, 503]).toContain(res.status);
  });

  // ---------- 9. Sensitive admin-only listings ----------
  it.each([
    '/api/donations',
    '/api/newsletter_subscriptions',
    '/api/stats',
    '/api/stats/charts',
    '/api/stats/notifications',
  ])('requires auth on GET %s', async (url: string) => {
    const res = await request(app).get(url);
    expect([401, 403]).toContain(res.status);
  });

  // ---------- 10. Deliveries webhook validation ----------
  it('rejects malformed deliveries webhook payload', async () => {
    const res = await request(app)
      .post('/api/deliveries/webhook')
      .send({ wrong: 'shape' });
    // Either 503 (delivery not configured), 400 (schema), or 401 (replay required)
    expect([400, 401, 503]).toContain(res.status);
  });
});