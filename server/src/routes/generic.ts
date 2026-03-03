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

// Mapping camelCase → snake_case pour contact_settings
function mapColumnName(table: string, column: string): string {
  if (table !== 'contact_settings') {
    return column;
  }
  
  // Mapping spécifique pour contact_settings basé sur le schéma Prisma
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

// Mapping inverse snake_case → camelCase pour contact_settings (pour les résultats GET)
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

// Convertir un objet de snake_case vers camelCase pour contact_settings
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
    const rows = await prisma.$queryRawUnsafe(sql, ...values) as Array<Record<string, unknown>>;
    // Mapper les résultats de snake_case vers camelCase pour contact_settings
    const mappedRows = rows.map(row => unmapRow(table, row));
    res.json({ data: mappedRows });
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
    
    const mappedKeys = keys.map(k => mapColumnName(table, k));
    
    // Exclure les champs qui ne doivent pas être insérés (comme id, createdAt, updatedAt)
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
    
    const sql = `INSERT INTO "${table}" (${filteredCols.join(', ')}) VALUES (${filteredParams.join(', ')}) RETURNING *`;
    const rows = await prisma.$queryRawUnsafe(sql, ...filteredValues) as Array<Record<string, unknown>>;
    // Mapper les résultats de snake_case vers camelCase pour contact_settings
    const mappedRow = unmapRow(table, rows[0]);
    res.status(201).json({ data: mappedRow });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

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
    
    // Mapper les noms de colonnes (camelCase → snake_case pour contact_settings)
    const mappedKeys = keys.map(k => mapColumnName(table, k));
    
    // Convertir les valeurs de date si nécessaire et exclure les champs auto-gérés
    const processedKeys: string[] = [];
    const processedValues: unknown[] = [];
    mappedKeys.forEach((mappedKey, idx) => {
      // Ne pas mettre à jour id, createdAt (updatedAt est géré automatiquement par le trigger)
      if (mappedKey !== 'id' && mappedKey !== 'created_at') {
        const originalKey = keys[idx];
        const val = body[originalKey];
        let processedVal = val;
        
        // Si c'est une chaîne qui ressemble à une date ISO et que le nom de colonne contient 'At' ou 'Date'
        if (typeof val === 'string' && (mappedKey.includes('_at') || mappedKey.includes('_date') || mappedKey.includes('At') || mappedKey.includes('Date')) && val.match(/^\d{4}-\d{2}-\d{2}/)) {
          processedVal = new Date(val);
        }
        
        // Sécurité pour les entiers (id, etc) passés en string par le front
        const idVal = Number(id);
        const finalId = isNaN(idVal) ? id : idVal;
        
        processedKeys.push(mappedKey);
        processedValues.push(processedVal);
      }
    });
    
    if (processedKeys.length === 0) {
      return res.status(400).json({ error: 'No fields to update (excluding auto-managed fields)' });
    }
    
    // Détection du type d'ID (Int vs UUID) pour la clause WHERE
    const idVal = Number(id);
    const finalId = !isNaN(idVal) && String(idVal) === id ? idVal : id;
    
    const setClause = processedKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const sql = `UPDATE "${table}" SET ${setClause} WHERE "id" = $${processedKeys.length + 1} RETURNING *`;
    const rows = await prisma.$queryRawUnsafe(sql, ...processedValues, finalId) as Array<Record<string, unknown>>;
    // Mapper les résultats de snake_case vers camelCase pour contact_settings
    const mappedRow = unmapRow(table, rows[0]);
    res.json({ data: mappedRow });
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
    
    // Détection du type d'ID (Int vs UUID)
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


