import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { isValidSertifierId } from '../utils/sertifierClient';
import { RagSystem } from '../rag';
import { prisma } from '../db';

function validateSertifierIds(body: any): string | null {
  const ids = [
    ['sertifierDesignId', body.sertifierDesignId],
    ['sertifierDetailId', body.sertifierDetailId],
    ['sertifierEmailTemplateId', body.sertifierEmailTemplateId],
  ] as const;
  const provided = ids.filter(([, v]) => v != null && String(v).trim() !== '');
  if (provided.length === 0) return null; // none provided is OK
  // If any provided, all three must be valid (Sertifier requires the trio)
  if (provided.length !== 3) return 'Pour activer Sertifier, les trois IDs (design, detail, email template) doivent être fournis.';
  for (const [name, v] of ids) {
    if (!isValidSertifierId(String(v).trim())) {
      return `ID Sertifier invalide pour ${name} (8-64 caractères alphanumériques).`;
    }
  }
  return null;
}
export const coursesRouter = Router();

const parseDuration = (dur: string | null): number => {
  if (!dur) return 0;
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

coursesRouter.get('/', async (_req: Request, res: Response) => {
  const items = await prisma.course.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

coursesRouter.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const item = await prisma.course.findUnique({ where: { slug } as any });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

coursesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const item = await prisma.course.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ data: item });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

coursesRouter.post('/', authRequired, moduleAccess('courses'), async (req: Request, res: Response) => {
  const { 
    title, slug, description, content, price, duration, level, 
    thumbnailUrl, videoUrl, isPublished, isCopyProtected, 
    category, instructorName, instructorBio,
    sertifierDesignId, sertifierDetailId, sertifierEmailTemplateId
  } = req.body || {};
  if (!title || !slug || price == null) return res.status(400).json({ error: 'missing fields' });
  const sertifierError = validateSertifierIds(req.body || {});
  if (sertifierError) return res.status(400).json({ error: sertifierError });
  const created = await prisma.course.create({
    data: { 
      title, slug, description, content, 
      price: Number(price), 
      duration: duration ? Number(duration) : null, 
      level, thumbnailUrl, videoUrl, 
      isPublished: Boolean(isPublished), 
      isCopyProtected: Boolean(isCopyProtected),
      category, instructorName, instructorBio,
      sertifierDesignId: sertifierDesignId || null,
      sertifierDetailId: sertifierDetailId || null,
      sertifierEmailTemplateId: sertifierEmailTemplateId || null,
    } as any,
  });
  res.status(201).json({ data: created });
});

coursesRouter.put('/:id', authRequired, moduleAccess('courses'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { 
    title, slug, description, content, price, duration, level, 
    thumbnailUrl, videoUrl, isPublished, isCopyProtected,
    category, instructorName, instructorBio,
    sertifierDesignId, sertifierDetailId, sertifierEmailTemplateId
  } = req.body || {};
  if (sertifierDesignId !== undefined || sertifierDetailId !== undefined || sertifierEmailTemplateId !== undefined) {
    const sertifierError = validateSertifierIds({ sertifierDesignId, sertifierDetailId, sertifierEmailTemplateId });
    if (sertifierError) return res.status(400).json({ error: sertifierError });
  }

  if (duration !== undefined && duration !== null) {
    const newCourseDuration = Number(duration);
    if (newCourseDuration > 0) {
      const courseWithModules = await prisma.course.findUnique({
        where: { id },
        include: { modules: { select: { duration: true } } }
      });
      
      if (courseWithModules) {
        const totalModulesDuration = courseWithModules.modules.reduce((sum: number, m: { duration: string | null }) => sum + parseDuration(m.duration), 0);
        if (totalModulesDuration > newCourseDuration) {
          return res.status(400).json({ 
            error: `La durée totale des modules (${totalModulesDuration} min) dépasse la nouvelle durée du cours (${newCourseDuration} min). Veuillez d'abord modifier la durée des modules.` 
          });
        }
      }
    }
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { 
      title, slug, description, content, 
      price: price !== undefined ? Number(price) : undefined,
      duration: duration !== undefined ? (duration ? Number(duration) : null) : undefined,
      level, thumbnailUrl, videoUrl, 
      isPublished: isPublished === undefined ? undefined : Boolean(isPublished),
      isCopyProtected: isCopyProtected === undefined ? undefined : Boolean(isCopyProtected),
      category, instructorName, instructorBio,
      sertifierDesignId: sertifierDesignId === undefined ? undefined : (sertifierDesignId || null),
      sertifierDetailId: sertifierDetailId === undefined ? undefined : (sertifierDetailId || null),
      sertifierEmailTemplateId: sertifierEmailTemplateId === undefined ? undefined : (sertifierEmailTemplateId || null),
    } as any,
  });
  res.json({ data: updated });
});

coursesRouter.delete('/:id', authRequired, moduleAccess('courses'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.course.delete({ where: { id } });
  // Best-effort : purge la source RAG associée (voir seeds.ts pour la rationale).
  RagSystem.getInstance(prisma).indexer.deleteSource(`course-${id}`).catch(() => void 0);
  res.json({ success: true });
});



