import { Router, Request, Response } from 'express';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { verifyRecaptcha } from '../middleware/recaptcha';
import { createRateLimiter } from '../middleware/rateLimit';
import { emailService } from '../utils/email';
import { prisma } from '../db';
export const jobApplicationsRouter = Router();

const jobApplicationLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

// Public: submit application
jobApplicationsRouter.post('/', jobApplicationLimiter, verifyRecaptcha('job_application'), async (req: Request, res: Response) => {
  try {
    const { careerId, careerTitle, fullName, email, phone, message, cvUrl, attachments } = req.body || {};
    if (!fullName || !email || !careerTitle) {
      return res.status(400).json({ error: 'Nom, email et poste sont requis' });
    }

    const application = await prisma.jobApplication.create({
      data: {
        careerId: careerId ? Number(careerId) : null,
        careerTitle,
        fullName,
        email,
        phone: phone || null,
        message: message || null,
        cvUrl: cvUrl || null,
        attachments: attachments || [],
      },
    });

    // Send email notification to admin
    try {
      await emailService.sendJobApplicationNotification({
        fullName,
        email,
        phone,
        careerTitle,
        message,
        cvUrl,
      });
    } catch (emailErr) {
      console.error('[JobApplication] Email notification error:', emailErr);
    }

    res.status(201).json({ data: application });
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return res.status(500).json({ error: 'Table not found. Please run migrations.' });
    }
    console.error('Error creating job application:', error);
    res.status(500).json({ error: error?.message || 'Failed to create application' });
  }
});

// Admin: list all applications
jobApplicationsRouter.get('/', authRequired, moduleAccess('careers'), async (_req: Request, res: Response) => {
  try {
    const items = await prisma.jobApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { career: { select: { title: true, department: true } } },
    });
    res.json({ data: items });
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return res.json({ data: [] });
    }
    res.status(500).json({ error: error?.message || 'Failed to fetch applications' });
  }
});

// Admin: update status
jobApplicationsRouter.put('/:id', authRequired, moduleAccess('careers'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    const updated = await prisma.jobApplication.update({
      where: { id },
      data: { status },
    });
    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to update application' });
  }
});

// Admin: delete
jobApplicationsRouter.delete('/:id', authRequired, moduleAccess('careers'), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.jobApplication.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to delete application' });
  }
});
