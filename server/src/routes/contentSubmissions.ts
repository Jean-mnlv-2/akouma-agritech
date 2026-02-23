import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired, adminOnly } from '../middleware/authRequired';

const prisma = new PrismaClient();
export const contentSubmissionsRouter = Router();

function mapContentSubmission(item: any) {
  let payload: any = {};
  try {
    payload = item.content ? JSON.parse(item.content) : {};
  } catch {
    payload = { description: item.content };
  }
  return {
    id: item.id,
    name: item.author,
    email: item.email,
    phone: payload.phone || null,
    organization: payload.organization || null,
    content_type: payload.content_type || null,
    title: item.title,
    description: payload.description || item.content,
    category: payload.category || null,
    duration: payload.duration || null,
    target_audience: payload.target_audience || null,
    file_url: payload.file_url || null,
    status: item.status,
    created_at: item.createdAt ? item.createdAt.toISOString() : null,
  };
}

contentSubmissionsRouter.get('/', authRequired, adminOnly, async (_req: Request, res: Response) => {
  const items = await prisma.contentSubmission.findMany({ orderBy: { createdAt: 'desc' } });
  const mapped = items.map(mapContentSubmission);
  res.json({ data: mapped });
});

contentSubmissionsRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body || {};
  const {
    title,
    content,
    author,
    email,
    name,
    phone,
    organization,
    content_type,
    description,
    category,
    duration,
    target_audience,
    file_url,
  } = body;

  const finalTitle = title || body.title || 'Proposition de contenu';
  const finalAuthor = author || name;
  const finalEmail = email || body.email;

  const payload = {
    phone: phone || null,
    organization: organization || null,
    content_type: content_type || null,
    description: description || content || '',
    category: category || null,
    duration: duration || null,
    target_audience: target_audience || null,
    file_url: file_url || null,
  };

  const finalContent = JSON.stringify(payload);

  if (!finalTitle || !finalAuthor || !finalEmail || !payload.description) {
    return res.status(400).json({ error: 'missing fields' });
  }

  const created = await prisma.contentSubmission.create({
    data: {
      title: finalTitle,
      content: finalContent,
      author: finalAuthor,
      email: finalEmail,
      status: 'pending',
    },
  });
  res.status(201).json({ data: mapContentSubmission(created) });
});

contentSubmissionsRouter.put('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, content, author, email, status } = req.body || {};
  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (author !== undefined) updateData.author = author;
  if (email !== undefined) updateData.email = email;
  if (status !== undefined) updateData.status = status;
  const updated = await prisma.contentSubmission.update({ where: { id }, data: updateData });
  res.json({ data: mapContentSubmission(updated) });
});

contentSubmissionsRouter.delete('/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.contentSubmission.delete({ where: { id } });
  res.json({ success: true });
});



