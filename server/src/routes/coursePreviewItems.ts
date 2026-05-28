import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const coursePreviewItemsRouter = Router();

coursePreviewItemsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const courseIdParam = req.query.courseId ? Number(req.query.courseId) : undefined;
    const where = { isActive: true, ...(courseIdParam ? { courseId: courseIdParam } : {}) } as any;
    const items = await prisma.coursePreviewItem.findMany({ 
      where, 
      orderBy: { order: 'asc' },
      include: { previewType: true }
    });
    res.json({ data: items });
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list' });
  }
});

coursePreviewItemsRouter.post('/', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const { typeId, ...rest } = req.body;
    
    if (!typeId) {
      return res.status(400).json({ error: 'Type de ressource requis' });
    }
    if (!rest.title) {
      return res.status(400).json({ error: 'Titre requis' });
    }
    if (!rest.contentUrl) {
      return res.status(400).json({ error: 'URL requis' });
    }
    if (!rest.courseId) {
      return res.status(400).json({ error: 'Cours requis' });
    }

    const type = await prisma.coursePreviewType.findUnique({ where: { id: Number(typeId) } });
    const created = await prisma.coursePreviewItem.create({ 
      data: { 
        ...rest, 
        courseId: Number(rest.courseId),
        typeId: Number(typeId),
        type: type?.name || 'video',
        order: Number(rest.order) || 0
      } 
    });
    res.json({ data: created });
  } catch (e: any) {
    console.error('Error creating preview item:', e);
    res.status(400).json({ error: e.message || 'failed_to_create' });
  }
});

coursePreviewItemsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { typeId, ...rest } = req.body;
    
    let updateData = { ...rest };
    if (typeId) {
      const type = await prisma.coursePreviewType.findUnique({ where: { id: Number(typeId) } });
      updateData.typeId = Number(typeId);
      updateData.type = type?.name || 'video';
    }

    const updated = await prisma.coursePreviewItem.update({ 
      where: { id }, 
      data: updateData 
    });
    res.json({ data: updated });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_update' });
  }
});

coursePreviewItemsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.coursePreviewItem.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_delete' });
  }
});
