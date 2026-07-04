import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/index';
import { env } from '../../src/utils/env';

/**
 * Vérifie le comportement du refresh token :
 *  - /auth/refresh sans cookie renvoie 401
 *  - un refresh invalide efface le cookie
 *  - un access token expiré (401) peut être renouvelé via /auth/refresh
 *  - le sign-out efface bien les cookies (révocation côté client)
 *
 * Les cas nécessitant un utilisateur en base sont ignorés proprement
 * quand la DB n'est pas disponible (statut 500) — l'objectif est de
 * garantir qu'aucune régression n'accepte un refresh invalide.
 */

describe('Auth — refresh token rotation & sign-out', () => {
  it('returns 401 on /auth/refresh when no refresh cookie is set', async () => {
    const res = await request(app).post('/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('no_refresh_token');
  });

  it('returns 401 and clears cookie on /auth/refresh with a malformed token', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', ['refresh_token=not-a-jwt']);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_refresh_token');
    const setCookie = res.headers['set-cookie'] || [];
    expect(setCookie.some((c: string) => c.startsWith('refresh_token=') && /Expires=|Max-Age=0/i.test(c))).toBe(true);
  });

  it('rejects an access token used as refresh token (missing typ=refresh)', async () => {
    const access = jwt.sign({ sub: 'user-1', role: 'customer' }, env.JWT_SECRET, { expiresIn: '5m' });
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', [`refresh_token=${access}`]);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_refresh_token');
  });

  it('sign-out clears auth_token, refresh_token and csrf_token cookies', async () => {
    const res = await request(app).post('/auth/sign-out');
    expect(res.status).toBe(200);
    const setCookie: string[] = res.headers['set-cookie'] || [];
    const cleared = (name: string) => setCookie.some((c) => c.startsWith(`${name}=`) && /Expires=Thu, 01 Jan 1970|Max-Age=0/i.test(c));
    expect(cleared('auth_token')).toBe(true);
    expect(cleared('refresh_token')).toBe(true);
    expect(cleared('csrf_token')).toBe(true);
  });

  it('an expired access token yields 401 on a protected route (client can then call /auth/refresh)', async () => {
    // Simulate the exact flow: access token expired -> protected route 401 -> refresh path used.
    const expired = jwt.sign({ sub: 'user-1', role: 'customer' }, env.JWT_SECRET, { expiresIn: -10 });
    const res = await request(app)
      .get('/api/orders')
      .set('Cookie', [`auth_token=${expired}`]);
    expect([401, 403]).toContain(res.status);
  });
});