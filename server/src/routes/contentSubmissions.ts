import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { prisma } from '../db';
export const contentSubmissionsRouter = Router();

contentSubmissionsRouter.get('/', authRequired, moduleAccess('submissions'), async (_req: Request, res: Response) => {
  const items = await prisma.contentSubmission.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ data: items });
});

contentSubmissionsRouter.post('/', async (req: Request, res: Response) => {
  const { 
    title, description, content, name, author, email, phone, organization, 
    content_type, contentType, category, duration, target_audience, targetAudience, 
    file_url, fileUrl 
  } = req.body || {};
  
  const finalTitle = title;
  const finalContent = content || description;
  const finalAuthor = author || name;
  const finalEmail = email;
  const finalPhone = phone;
  const finalOrganization = organization;
  const finalContentType = contentType || content_type;
  const finalCategory = category;
  const finalDuration = duration;
  const finalTargetAudience = targetAudience || target_audience;
  const finalFileUrl = fileUrl || file_url;

  if (!finalTitle || !finalContent || !finalAuthor || !finalEmail) {
    return res.status(400).json({ error: 'missing fields' });
  }

  try {
    const created = await prisma.contentSubmission.create({ 
      data: { 
        title: finalTitle, 
        content: finalContent, 
        author: finalAuthor, 
        email: finalEmail,
        phone: finalPhone || null,
        organization: finalOrganization || null,
        contentType: finalContentType || null,
        category: finalCategory || null,
        duration: finalDuration || null,
        targetAudience: finalTargetAudience || null,
        fileUrl: finalFileUrl || null,
        status: 'pending' 
      } 
    });
    res.status(201).json({ data: created });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Bad request';
    res.status(400).json({ error });
  }
});

contentSubmissionsRouter.put('/:id', authRequired, moduleAccess('submissions'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, content, author, email, status } = req.body || {};
  const updated = await prisma.contentSubmission.update({ where: { id }, data: { title, content, author, email, status } });
  res.json({ data: updated });
});

contentSubmissionsRouter.delete('/:id', authRequired, moduleAccess('submissions'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.contentSubmission.delete({ where: { id } });
  res.json({ success: true });
});



