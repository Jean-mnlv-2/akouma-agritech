import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const genericRouter = Router();

// Liste blanche des tables gérées par CRUD générique
const allowedTables = new Set<string>([
  'courses',
  'seeds',
  'news',
  'shop_products',
  'legal_pages',
  'countries',
  'partnerships',
  'donations',
  'contact_messages',
  'content_submissions',
  'demo_requests',
  'elearning_enrollments',
  'newsletter_subscriptions',
  'profiles',
  'user_roles',
  'events',
  'careers',
  'contact_settings',
]);

function ensureTable(table: string): string {
  if (!allowedTables.has(table)) {
    throw new Error('Table not allowed');
  }
  return table;
}

function parseOrder(query: any): { orderBy?: string; orderDir?: 'asc' | 'desc' } {
  const orderBy = typeof query.orderBy === 'string' ? query.orderBy : undefined;
  const orderDir = query.orderDir === 'asc' || query.orderDir === 'desc' ? query.orderDir : undefined;
  return { orderBy, orderDir };
}

// LIST
genericRouter.get('/:table', async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const { orderBy, orderDir } = parseOrder(req.query);

    // Filtrage simple eq si un seul param (ex: id=..., status=...)
    const filters = { ...req.query } as Record<string, any>;
    delete (filters as any).orderBy;
    delete (filters as any).orderDir;

    let whereClause = '';
    const values: any[] = [];
    const filterKeys = Object.keys(filters);
    if (filterKeys.length > 0) {
      const clauses = filterKeys.map((k, idx) => {
        values.push(filters[k]);
        return `"${k}" = $${idx + 1}`;
      });
      whereClause = `WHERE ${clauses.join(' AND ')}`;
    }

    let orderClause = '';
    if (orderBy) {
      orderClause = `ORDER BY "${orderBy}" ${orderDir === 'asc' ? 'asc' : 'desc'}`;
    } else {
      // Par défaut: si created_at existe, trier dessus desc
      orderClause = `ORDER BY 1`;
    }

    const sql = `SELECT * FROM "${table}" ${whereClause} ${orderClause}`;
    const rows = (await prisma.$queryRawUnsafe(sql, ...values)) as any[];
    res.json({ data: rows });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Bad request' });
  }
});

// CREATE
genericRouter.post('/:table', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const keys = Object.keys(body);
    const cols = keys.map((k) => `"${k}"`).join(', ');
    const params = keys.map((_k, i) => `$${i + 1}`).join(', ');
    const values = keys.map((k) => body[k]);
    const sql = `INSERT INTO "${table}" (${cols}) VALUES (${params}) RETURNING *`;
    const rows = (await prisma.$queryRawUnsafe(sql, ...values)) as any[];
    res.status(201).json({ data: rows[0] });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Bad request' });
  }
});

// UPDATE (id obligatoire dans l'URL)
genericRouter.put('/:table/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const id = req.params.id;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const keys = Object.keys(body);
    if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });
    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map((k) => body[k]);
    const sql = `UPDATE "${table}" SET ${setClause} WHERE "id" = $${keys.length + 1} RETURNING *`;
    const rows = (await prisma.$queryRawUnsafe(sql, ...values, id)) as any[];
    res.json({ data: rows[0] });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Bad request' });
  }
});

// DELETE (id obligatoire dans l'URL)
genericRouter.delete('/:table/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const id = req.params.id;
    const sql = `DELETE FROM "${table}" WHERE "id" = $1`;
    await prisma.$queryRawUnsafe(sql, id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Bad request' });
  }
});


