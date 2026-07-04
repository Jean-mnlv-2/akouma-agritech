import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/index';
import { env } from '../../src/utils/env';

/**
 * Vérifie que le CRUD générique (`routes/generic.ts`) refuse le
 * mass-assignment sur les colonnes FORBIDDEN_COLUMNS pour
 * create / update / delete et sur les filtres GET.
 *
 * Ces tests s'exécutent sans base de données réelle : soit la route
 * répond 400 (validation), 401/403 (auth), soit 500 (DB absente).
 * Un 200 avec un champ interdit accepté serait une régression critique.
 */

function adminBearer() {
  const token = jwt.sign({ sub: 'admin-1', role: 'admin' }, env.JWT_SECRET, { expiresIn: '5m' });
  return `Bearer ${token}`;
}

const FORBIDDEN = ['id', 'role', 'password_hash', 'passwordHash', 'user_id', 'userId', 'is_admin', 'isAdmin'];

describe('Generic CRUD — mass-assignment protection', () => {
  it('rejects unauthenticated CREATE on a whitelisted table', async () => {
    const res = await request(app).post('/api/events').send({ title: 'x' });
    expect([401, 403]).toContain(res.status);
  });

  it('rejects unauthenticated UPDATE on a whitelisted table', async () => {
    const res = await request(app).put('/api/events/1').send({ title: 'x' });
    expect([401, 403]).toContain(res.status);
  });

  it('rejects unauthenticated DELETE on a whitelisted table', async () => {
    const res = await request(app).delete('/api/events/1');
    expect([401, 403]).toContain(res.status);
  });

  it('refuses tables not on the allow-list', async () => {
    const res = await request(app).get('/api/user_roles');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not allowed/i);
  });

  it.each([
    'donations',
    'profiles',
    'user_roles',
    'elearning_enrollments',
  ])('does not expose sensitive table "%s" via generic list', async (table) => {
    const res = await request(app).get(`/api/${table}`);
    // Sensitive tables are removed from the generic allow-list;
    // dedicated routers require auth. Either way, generic access is denied.
    if (res.status === 400) {
      expect(res.body.error).toMatch(/not allowed/i);
    } else {
      expect([401, 403]).toContain(res.status);
    }
  });

  it.each(FORBIDDEN)('drops forbidden column "%s" from CREATE payload', async (col) => {
    const payload: Record<string, unknown> = { [col]: 'attacker-value' };
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', adminBearer())
      .send(payload);
    // With only a forbidden field the row has no valid columns to insert -> 400.
    // Never 201 with the forbidden field accepted.
    expect(res.status).not.toBe(201);
    expect([400, 401, 403]).toContain(res.status);
  });

  it.each(FORBIDDEN)('drops forbidden column "%s" from UPDATE payload', async (col) => {
    const payload: Record<string, unknown> = { [col]: 'attacker-value' };
    const res = await request(app)
      .put('/api/events/1')
      .set('Authorization', adminBearer())
      .send(payload);
    expect(res.status).not.toBe(200);
    expect([400, 401, 403]).toContain(res.status);
  });

  it('ignores forbidden column filter on GET (does not error out with SQL)', async () => {
    // ?role=admin must be silently dropped as a filter (isValidColumnName returns false).
    const res = await request(app).get('/api/events?role=admin&password_hash=abc');
    // 200 (list) or 500 (no DB in test env) — but never a Postgres syntax error
    // referring to the forbidden columns.
    if (typeof res.body === 'object' && res.body?.error) {
      expect(String(res.body.error)).not.toMatch(/role|password_hash/i);
    }
  });

  it('rejects an unknown ordering column that matches a forbidden name', async () => {
    // orderBy=role must be dropped (forbidden). Fallback ORDER BY 1 keeps query valid.
    const res = await request(app).get('/api/events?orderBy=role&orderDir=asc');
    if (typeof res.body === 'object' && res.body?.error) {
      expect(String(res.body.error)).not.toMatch(/role/i);
    }
  });
});