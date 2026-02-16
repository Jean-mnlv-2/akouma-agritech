import request from 'supertest';
import { app } from '../../src/index';

describe('Auth routes integration', () => {
  it('returns 400 when credentials are missing on sign-in', async () => {
    const res = await request(app).post('/auth/sign-in').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('email and password required');
  });

  it('returns 400 when credentials are missing on sign-up', async () => {
    const res = await request(app).post('/auth/sign-up').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('email and password required');
  });

  it('returns null user when no session cookie is present', async () => {
    const res = await request(app).get('/auth/session');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
});

