"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../../src/index");
describe('Auth routes integration', () => {
    it('returns 400 when credentials are missing on sign-in', async () => {
        const res = await (0, supertest_1.default)(index_1.app).post('/auth/sign-in').send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('email and password required');
    });
    it('returns 400 when credentials are missing on sign-up', async () => {
        const res = await (0, supertest_1.default)(index_1.app).post('/auth/sign-up').send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('email and password required');
    });
    it('returns null user when no session cookie is present', async () => {
        const res = await (0, supertest_1.default)(index_1.app).get('/auth/session');
        expect(res.status).toBe(200);
        expect(res.body.user).toBeNull();
    });
});
