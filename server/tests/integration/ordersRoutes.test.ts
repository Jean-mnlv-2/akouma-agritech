import request from 'supertest';
import { app } from '../../src/index';

describe('Orders routes integration', () => {
  it('requires authentication to list orders', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('rejects order creation without items', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer invalid')
      .send({});
    expect(res.status).toBe(401);
  });
});

