import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Express middleware factory that validates a request slice (body/query/params)
 * against a Zod schema. Use `.strict()` on object schemas to refuse unknown
 * fields (anti mass-assignment). On success, replaces the slice with the
 * parsed (and stripped) data so downstream handlers only see known fields.
 */
export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'validation_failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }
      // Overwrite with sanitized data (strict schemas drop unknowns).
      if (source === 'body') req.body = parsed.data;
      else if (source === 'query') (req as any).query = parsed.data;
      else (req as any).params = parsed.data;
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ error: 'validation_failed', details: e.flatten().fieldErrors });
      }
      next(e);
    }
  };
}