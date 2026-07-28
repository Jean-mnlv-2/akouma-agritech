import { Router, Request, Response } from 'express';
import { authRequired } from '../middleware/authRequired';
import { prisma } from '../db';
export const courseCommentsRouter = Router();

// Get comments for a course (public)
courseCommentsRouter.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    const moduleId = req.query.moduleId ? Number(req.query.moduleId) : undefined;
    
    const where: any = { courseId, isApproved: true, parentId: null };
    if (moduleId) where.moduleId = moduleId;
    
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
