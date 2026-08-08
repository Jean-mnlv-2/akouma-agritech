import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { prisma } from '../db';
export const courseCommentsRouter = Router();

// Get comments for a course (public)
courseCommentsRouter.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    // `generalOnly=true` isole le chat général (moduleId=null) des discussions
    // par module — un `moduleId=0` ne peut pas servir de sentinelle car 0 est
    // faux en JS, ce qui désactivait silencieusement ce filtre auparavant.
    const generalOnly = req.query.generalOnly === 'true';
    const moduleId = req.query.moduleId !== undefined ? Number(req.query.moduleId) : undefined;

    const where: any = { courseId, isApproved: true, parentId: null };
    if (generalOnly) {
      where.moduleId = null;
    } else if (moduleId !== undefined && !isNaN(moduleId)) {
      where.moduleId = moduleId;
    }
    
    const comments = await prisma.courseComment.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        replies: {
          where: { isApproved: true },
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: comments });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Post a comment (authenticated)
courseCommentsRouter.post('/', authRequired, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    
    const { courseId, moduleId, content, parentId } = req.body;
    if (!courseId || !content?.trim()) return res.status(400).json({ error: 'courseId and content required' });
    
    const comment = await prisma.courseComment.create({
      data: {
        courseId: Number(courseId),
        moduleId: moduleId ? Number(moduleId) : null,
        userId: user.id,
        content: content.trim(),
        parentId: parentId ? Number(parentId) : null,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    res.status(201).json({ data: comment });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to post comment' });
  }
});

// Moderate a comment (admin/supervisor with 'courses' module): approve or
// hide, without deleting it outright (keeps a trace, reversible).
courseCommentsRouter.put('/:id/moderate', authRequired, moduleAccess('courses'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { isApproved } = req.body || {};
    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ error: 'isApproved (boolean) required' });
    }
    const comment = await prisma.courseComment.update({
      where: { id },
      data: { isApproved },
    });
    res.json({ data: comment });
  } catch (e) {
    res.status(400).json({ error: 'Failed to moderate comment' });
  }
});

// Delete own comment
courseCommentsRouter.delete('/:id', authRequired, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    const comment = await prisma.courseComment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ error: 'Not found' });
    if (comment.userId !== user?.id && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await prisma.courseComment.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Failed to delete comment' });
  }
});
