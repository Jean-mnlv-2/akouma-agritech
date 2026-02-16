"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rateLimit_1 = require("../../src/middleware/rateLimit");
function createMockReq() {
    return {
        method: 'POST',
        baseUrl: '/auth/sign-in',
        ip: '127.0.0.1',
    };
}
function createMockRes() {
    const res = {};
    res.statusCode = 200;
    res.status = ((code) => {
        res.statusCode = code;
        return res;
    });
    res.json = ((body) => {
        return body;
    });
    return res;
}
describe('rateLimit middleware', () => {
    it('allows requests under the limit', () => {
        const limiter = (0, rateLimit_1.createRateLimiter)({ windowMs: 1000, max: 2 });
        const req = createMockReq();
        const res = createMockRes();
        const next = jest.fn();
        limiter(req, res, next);
        limiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(2);
    });
    it('blocks requests over the limit', () => {
        const limiter = (0, rateLimit_1.createRateLimiter)({ windowMs: 1000, max: 1 });
        const req = createMockReq();
        const res = createMockRes();
        const next = jest.fn();
        limiter(req, res, next);
        limiter(req, res, next);
        expect(res.statusCode).toBe(429);
    });
});
