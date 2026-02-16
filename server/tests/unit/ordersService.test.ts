import { DeliveryMethod } from '@prisma/client';
import { OrdersService } from '../../src/services/ordersService';

describe('OrdersService business logic', () => {
  const service = new OrdersService({} as any);

  it('calculates shipping as zero for pickup', () => {
    const amount = service.calculateShipping(10000, DeliveryMethod.PICKUP);
    expect(amount).toBe(0);
  });

  it('calculates shipping using partner baseRate when provided', () => {
    const baseRate: any = { toString: () => '7500', valueOf: () => 7500 };
    const amount = service.calculateShipping(10000, DeliveryMethod.DELIVERY, { baseRate });
    expect(amount).toBe(7500);
  });

  it('applies free delivery when subtotal exceeds threshold', () => {
    const amount = service.calculateShipping(60000, DeliveryMethod.DELIVERY, null as any);
    expect(amount).toBe(0);
  });

  it('applies percentage discount correctly', () => {
    const discountValue: any = { toString: () => '10', valueOf: () => 10 };
    const amount = service.calculateDiscountAmount(10000, { discountType: 'PERCENTAGE', discountValue });
    expect(amount).toBe(1000);
  });

  it('does not exceed subtotal when applying fixed discount', () => {
    const discountValue: any = { toString: () => '20000', valueOf: () => 20000 };
    const amount = service.calculateDiscountAmount(15000, { discountType: 'FIXED', discountValue });
    expect(amount).toBe(15000);
  });
});
