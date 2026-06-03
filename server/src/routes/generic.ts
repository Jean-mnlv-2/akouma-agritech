import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { csrfRequired } from '../middleware/csrf';

const prisma = new PrismaClient();
export const genericRouter = Router();

// Liste blanche des tables gérées par CRUD générique
const publicTables = new Set<string>([
  'courses',
  'seeds',
  'news',
  'shop_products',
  'legal_pages',
  'countries',
  'partnerships',
  'events',
  'careers',
  'donation_impacts',
  'success_stories',
  'live_streams',
  'elearning_stats',
  'partners',
  'course_preview_types',
  'course_preview_items',
  'page_header_images',
]);

const adminOnlyTables = new Set<string>([
  'donations',
  'contact_messages',
  'content_submissions',
  'demo_requests',
  'elearning_enrollments',
  'newsletter_subscriptions',
  'profiles',
  'user_roles',
  'contact_settings',
]);

const allowedTables = new Set([...publicTables, ...adminOnlyTables]);

function ensureTable(table: string): string {
  if (!allowedTables.has(table)) {
    throw new Error('Table not allowed');
  }
  return table;
}

function isValidColumnName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

function mapColumnName(table: string, column: string): string {
  if (table !== 'contact_settings') {
    return column;
  }
  
  const columnMap: Record<string, string> = {
    'whatsappNumber': 'whatsapp_number',
    'addressLine1': 'address_line1',
    'addressLine2': 'address_line2',
    'facebookUrl': 'facebook_url',
    'instagramUrl': 'instagram_url',
    'tiktokUrl': 'tiktok_url',
    'youtubeUrl': 'youtube_url',
    'linkedinUrl': 'linkedin_url',
    'xUrl': 'x_url',
    'websiteUrl': 'website_url',
    'telegramUrl': 'telegram_url',
    'updatedAt': 'updated_at',
    'createdAt': 'created_at',
    'supportEmail': 'support_email',
    'businessHours': 'business_hours',
    'mapUrl': 'map_url',
  };
  
  return columnMap[column] || column;
}

function unmapColumnName(table: string, column: string): string {
  if (table !== 'contact_settings') {
    return column;
  }
  
  // Mapping inverse pour contact_settings
  const columnMap: Record<string, string> = {
    'whatsapp_number': 'whatsappNumber',
    'address_line1': 'addressLine1',
    'address_line2': 'addressLine2',
    'facebook_url': 'facebookUrl',
    'instagram_url': 'instagramUrl',
      'tiktok_url': 'tiktokUrl',
      'youtube_url': 'youtubeUrl',
    'linkedin_url': 'linkedinUrl',
    'x_url': 'xUrl',
    'website_url': 'websiteUrl',
    'telegram_url': 'telegramUrl',
    'updated_at': 'updatedAt',
    'created_at': 'createdAt',
    'support_email': 'supportEmail',
    'business_hours': 'businessHours',
    'map_url': 'mapUrl',
  };
  
  return columnMap[column] || column;
}

function unmapRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  if (table !== 'contact_settings') {
    return row;
  }
  
  const unmapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    unmapped[unmapColumnName(table, key)] = value;
  }
  return unmapped;
}

function parseOrder(query: Record<string, unknown>): { orderBy?: string; orderDir?: 'asc' | 'desc' } {
  const orderBy = typeof query.orderBy === 'string' && isValidColumnName(query.orderBy) ? query.orderBy : undefined;
  const orderDir = query.orderDir === 'asc' || query.orderDir === 'desc' ? query.orderDir : undefined;
  return { orderBy, orderDir };
}

function parsePagination(query: Record<string, unknown>): { limit?: number; offset?: number } {
  const rawLimit = typeof query.limit === 'string' ? Number(query.limit) : undefined;
  const rawOffset = typeof query.offset === 'string' ? Number(query.offset) : undefined;

  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(1000, rawLimit as number)) : undefined;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset as number) : undefined;

  return { limit, offset };
}

function shouldManageUpdatedAt(table: string): boolean {
  return table === 'contact_settings';
}

// LIST
genericRouter.get('/:table', async (req: Request, res: Response, next) => {
  try {
    const table = ensureTable(req.params.table);
    if (adminOnlyTables.has(table)) {
      // For admin-only tables, chain to authRequired + adminOnly
      authRequired(req, res, () => {
        adminOnly(req, res, async () => {
          await handleGenericGet(req, res, table);
        });
      });
    } else {
      // Public tables
      await handleGenericGet(req, res, table);
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

async function handleGenericGet(req: Request, res: Response, table: string) {
  const { orderBy, orderDir } = parseOrder(req.query as Record<string, unknown>);
  const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

  const filters: Record<string, unknown> = { ...req.query };
  delete filters.orderBy;
  delete filters.orderDir;
  delete filters.limit;
  delete filters.offset;

  let whereClause = '';
  const values: unknown[] = [];
  const filterKeys = Object.keys(filters).filter(k => isValidColumnName(k));
  if (filterKeys.length > 0) {
    const clauses = filterKeys.map((k, idx) => {
      const mapped = mapColumnName(table, k);
      values.push(filters[k]);
      return `"${mapped}" = $${idx + 1}`;
    });
    whereClause = `WHERE ${clauses.join(' AND ')}`;
  }

  let orderClause = '';
  if (orderBy) {
    orderClause = `ORDER BY "${orderBy}" ${orderDir === 'asc' ? 'asc' : 'desc'}`;
  } else {
    orderClause = `ORDER BY 1`;
  }

  const limitClause = limit ? `LIMIT ${limit}` : 'LIMIT 1000';
  const offsetClause = offset ? `OFFSET ${offset}` : '';

  const sql = `SELECT * FROM "${table}" ${whereClause} ${orderClause} ${limitClause} ${offsetClause}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...values) as Array<Record<string, unknown>>;
  const mappedRows = rows.map(row => unmapRow(table, row));
  res.json({ data: mappedRows });
}

// CREATE
genericRouter.post('/:table', authRequired, adminOnly, csrfRequired, async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
    const keys = Object.keys(body).filter(k => isValidColumnName(k));
    if (keys.length === 0) {
      return res.status(400).json({ error: 'No valid fields to insert' });
    }
    
    const mappedKeys = keys.map(k => mapColumnName(table, k));
    
    const filteredCols: string[] = [];
    const filteredParams: string[] = [];
    const filteredValues: unknown[] = [];
    mappedKeys.forEach((col, idx) => {
      const originalKey = keys[idx];
      const val = body[originalKey];
      
      if (col !== 'id' && col !== 'created_at' && col !== 'updated_at') {
        let processedVal = val;
        
        if (typeof val === 'string' && (col.includes('_at') || col.includes('_date') || col.includes('At') || col.includes('Date')) && val.match(/^\d{4}-\d{2}-\d{2}/)) {
          processedVal = new Date(val);
        }
        
        filteredCols.push(`"${col}"`);
        filteredParams.push(`$${filteredValues.length + 1}`);
        filteredValues.push(processedVal);
      }
    });
    
    if (filteredCols.length === 0) {
      return res.status(400).json({ error: 'No valid fields to insert (excluding auto-managed fields)' });
    }

    if (shouldManageUpdatedAt(table) && !filteredCols.includes('"updated_at"')) {
      filteredCols.push('"updated_at"');
      filteredParams.push('NOW()');
    }
    
    const sql = `INSERT INTO "${table}" (${filteredCols.join(', ')}) VALUES (${filteredParams.join(', ')}) RETURNING *`;
    const rows = await prisma.$queryRawUnsafe(sql, ...filteredValues) as Array<Record<string, unknown>>;
    const mappedRow = unmapRow(table, rows[0]);
    res.status(201).json({ data: mappedRow });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

genericRouter.put('/:table/:id', authRequired, adminOnly, csrfRequired, async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid id parameter' });
    }
    const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
    const keys = Object.keys(body).filter(k => isValidColumnName(k));
    if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });
    
    const mappedKeys = keys.map(k => mapColumnName(table, k));
    
    const processedKeys: string[] = [];
    const processedValues: unknown[] = [];
    mappedKeys.forEach((mappedKey, idx) => {
      if (mappedKey !== 'id' && mappedKey !== 'created_at') {
        const originalKey = keys[idx];
        const val = body[originalKey];
        let processedVal = val;
        
        if (typeof val === 'string' && (mappedKey.includes('_at') || mappedKey.includes('_date') || mappedKey.includes('At') || mappedKey.includes('Date')) && val.match(/^\d{4}-\d{2}-\d{2}/)) {
          processedVal = new Date(val);
        }
        
        const idVal = Number(id);
        const finalId = isNaN(idVal) ? id : idVal;
        
        processedKeys.push(mappedKey);
        processedValues.push(processedVal);
      }
    });
    
    if (processedKeys.length === 0) {
      return res.status(400).json({ error: 'No fields to update (excluding auto-managed fields)' });
    }
    
    const idVal = Number(id);
    const finalId = !isNaN(idVal) && String(idVal) === id ? idVal : id;
    
    const setParts = processedKeys.map((k, i) => `"${k}" = $${i + 1}`);
    if (shouldManageUpdatedAt(table)) {
      setParts.push(`"updated_at" = NOW()`);
    }
    const setClause = setParts.join(', ');
    const sql = `UPDATE "${table}" SET ${setClause} WHERE "id" = $${processedKeys.length + 1} RETURNING *`;
    const rows = await prisma.$queryRawUnsafe(sql, ...processedValues, finalId) as Array<Record<string, unknown>>;
    const mappedRow = unmapRow(table, rows[0]);
    res.json({ data: mappedRow });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

// DELETE (id obligatoire dans l'URL)
genericRouter.delete('/:table/:id', authRequired, adminOnly, csrfRequired, async (req: Request, res: Response) => {
  try {
    const table = ensureTable(req.params.table);
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid id parameter' });
    }
    
    const idVal = Number(id);
    const finalId = !isNaN(idVal) && String(idVal) === id ? idVal : id;
    
    const sql = `DELETE FROM "${table}" WHERE "id" = $1`;
    await prisma.$queryRawUnsafe(sql, finalId);
    res.json({ success: true });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});


