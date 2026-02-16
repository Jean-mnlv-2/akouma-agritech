"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const ordersService_1 = require("../../src/services/ordersService");
describe('OrdersService business logic', () => {
    const service = new ordersService_1.OrdersService({});
    it('calculates shipping as zero for pickup', () => {
        const amount = service.calculateShipping(10000, client_1.DeliveryMethod.PICKUP);
        expect(amount).toBe(0);
    });
    it('calculates shipping using partner baseRate when provided', () => {
        const baseRate = { toString: () => '7500', valueOf: () => 7500 };
        const amount = service.calculateShipping(10000, client_1.DeliveryMethod.DELIVERY, { baseRate });
        expect(amount).toBe(7500);
    });
    it('applies free delivery when subtotal exceeds threshold', () => {
        const amount = service.calculateShipping(60000, client_1.DeliveryMethod.DELIVERY, null);
        expect(amount).toBe(0);
    });
    it('applies percentage discount correctly', () => {
        const discountValue = { toString: () => '10', valueOf: () => 10 };
        const amount = service.calculateDiscountAmount(10000, { discountType: 'PERCENTAGE', discountValue });
        expect(amount).toBe(1000);
    });
    it('does not exceed subtotal when applying fixed discount', () => {
        const discountValue = { toString: () => '20000', valueOf: () => 20000 };
        const amount = service.calculateDiscountAmount(15000, { discountType: 'FIXED', discountValue });
        expect(amount).toBe(15000);
    });
});
