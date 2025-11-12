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

// Validation des noms de colonnes pour éviter l'injection SQL
function isValidColumnName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

function parseOrder(query: Record<string, unknown>): { orderBy?: string; orderDir?: 'asc' | 'desc' } {
  const orderBy = typeof query.orderBy === 'string' && isValidColumnName(query.orderBy) ? query.orderBy : undefined;
  const orderDir = query.orderDir === 'asc' || query.orderDir === 'desc' ? query.orderDir : undefined;
  return { orderBy, orderDir };
}

// LIST
genericRouter.get('/:table', async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const { orderBy, orderDir } = parseOrder(req.query as Record<string, unknown>);

    // Filtrage simple eq si un seul param (ex: id=..., status=...)
    const filters: Record<string, unknown> = { ...req.query };
    delete filters.orderBy;
    delete filters.orderDir;

    let whereClause = '';
    const values: unknown[] = [];
    const filterKeys = Object.keys(filters).filter(k => isValidColumnName(k));
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
    const rows = await prisma.$queryRawUnsafe(sql, ...values);
    res.json({ data: rows });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

// CREATE
genericRouter.post('/:table', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
    const keys = Object.keys(body).filter(k => isValidColumnName(k));
    if (keys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to insert' });
    }
    const cols = keys.map((k) => `"${k}"`).join(', ');
    const params = keys.map((_k, i) => `$${i + 1}`).join(', ');
    const values = keys.map((k) => body[k]);
    const sql = `INSERT INTO "${table}" (${cols}) VALUES (${params}) RETURNING *`;
    const rows = await prisma.$queryRawUnsafe(sql, ...values) as Array<Record<string, unknown>>;
    res.status(201).json({ data: rows[0] });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

// UPDATE (id obligatoire dans l'URL)
genericRouter.put('/:table/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid id parameter' });
    }
    const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
    const keys = Object.keys(body).filter(k => isValidColumnName(k));
    if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });
    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map((k) => body[k]);
    const sql = `UPDATE "${table}" SET ${setClause} WHERE "id" = $${keys.length + 1} RETURNING *`;
    const rows = await prisma.$queryRawUnsafe(sql, ...values, id) as Array<Record<string, unknown>>;
    res.json({ data: rows[0] });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

// DELETE (id obligatoire dans l'URL)
genericRouter.delete('/:table/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid id parameter' });
    }
    const sql = `DELETE FROM "${table}" WHERE "id" = $1`;
    await prisma.$queryRawUnsafe(sql, id);
    res.json({ success: true });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});


