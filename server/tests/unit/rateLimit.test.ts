import { Request, Response, NextFunction } from 'express';
import { createRateLimiter } from '../../src/middleware/rateLimit';

function createMockReq(): Request {
  return {
    method: 'POST',
    baseUrl: '/auth/sign-in',
    ip: '127.0.0.1',
  } as unknown as Request;
}

function createMockRes() {
  const res: Partial<Response> = {};
  res.statusCode = 200;
  res.status = ((code: number) => {
    res.statusCode = code;
    return res as Response;
  }) as unknown as Response['status'];
  res.json = ((body: unknown) => {
    return body;
  }) as unknown as Response['json'];
  return res as Response;
}

describe('rateLimit middleware', () => {
  it('allows requests under the limit', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn() as unknown as NextFunction;

    limiter(req, res, next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('blocks requests over the limit', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn() as unknown as NextFunction;

    limiter(req, res, next);
    limiter(req, res, next);

    expect(res.statusCode).toBe(429);
  });
});
