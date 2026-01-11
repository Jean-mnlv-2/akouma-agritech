import { z } from 'zod';

export const createSeedSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().min(1, 'Description requise'),
  price: z.number().positive('Prix doit être positif'),
  stock: z.number().int().nonnegative().default(0),
  imageUrl: z.string().url().optional(),
});

export const updateSeedSchema = createSeedSchema.partial();

export type CreateSeedInput = z.infer<typeof createSeedSchema>;
export type UpdateSeedInput = z.infer<typeof updateSeedSchema>;
