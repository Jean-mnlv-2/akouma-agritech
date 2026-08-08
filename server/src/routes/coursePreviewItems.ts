import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { prisma } from '../db';
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

// Admin: list every item regardless of isActive — the public route above
// filters isActive:true unconditionally, so without this route a
// deactivated item becomes invisible in the admin screen with no way to
// find it again to reactivate it.
coursePreviewItemsRouter.get('/admin', authRequired, moduleAccess('course-previews'), async (req: Request, res: Response) => {
  try {
    const courseIdParam = req.query.courseId ? Number(req.query.courseId) : undefined;
    const where = courseIdParam ? { courseId: courseIdParam } : {};
    const items = await prisma.coursePreviewItem.findMany({
      where,
      orderBy: { order: 'asc' },
      include: { previewType: true },
    });
    res.json({ data: items });
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list' });
  }
});

coursePreviewItemsRouter.post('/', authRequired, moduleAccess('course-previews'), async (req: Request, res: Response) => {
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

coursePreviewItemsRouter.put('/:id', authRequired, moduleAccess('course-previews'), async (req: Request, res: Response) => {
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

coursePreviewItemsRouter.delete('/:id', authRequired, moduleAccess('course-previews'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.coursePreviewItem.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'failed_to_delete' });
  }
});
