import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.number().positive(),
  productType: z.enum(['shop_product', 'seed']).default('shop_product'),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  imageUrl: z.string().url().nullable().optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Le panier ne peut pas être vide'),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingCountry: z.string().optional(),
  shippingPhone: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  promoCode: z.string().optional(),
  deliveryMethod: z.enum(['PICKUP', 'DELIVERY']).default('PICKUP'),
  deliveryPartnerId: z.number().positive().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
