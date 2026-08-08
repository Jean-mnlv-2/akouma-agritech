import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authRequired, moduleAccess } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { computeEffectiveOpenDate } from '../utils/cohortSchedule';
import { prisma } from '../db';
export const rattrapageRequestsRouter = Router();

const createSchema = z.object({
  enrollmentId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  moduleId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
}).strict();

const resolveSchema = z.object({
  status: z.enum(['granted', 'rejected']),
  resolutionNote: z.string().max(2000).optional().nullable(),
  alternateModuleId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/), z.null()]).optional(),
}).strict();

// Apprenant : demander un rattrapage pour un module non validé dont la
// fenêtre d'évaluation est fermée (re-vérifié ici, jamais fait confiance au
// client — même règle que GET /course_modules/course/:courseId).
rattrapageRequestsRouter.post('/', authRequired, validate(createSchema), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const enrollmentId = Number(req.body.enrollmentId);
    const moduleId = Number(req.body.moduleId);

    const enrollment = await prisma.eLearningEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    if (enrollment.userId !== user.id) return res.status(403).json({ error: 'forbidden' });

    const targetModule = await prisma.courseModule.findUnique({ where: { id: moduleId } });
    if (!targetModule || targetModule.courseId !== enrollment.courseId) {
      return res.status(404).json({ error: 'Module not found for this course' });
    }

    const existingProgress = await prisma.moduleProgress.findUnique({
      where: { enrollmentId_moduleId: { enrollmentId, moduleId } },
    });
    if (existingProgress?.completed) {
      return res.status(400).json({ error: 'already_validated' });
    }

    // Un quiz de module se ferme quand le module suivant ouvre (pas de champ
    // closeDate séparé). L'examen de synthèse, dernier module, n'a pas de
    // "suivant" : son déclencheur est une tentative déjà enregistrée (voir
    // POST /course_modules/progress avec completed:false), sinon il resterait
    // rejouable indéfiniment sans jamais avoir besoin de rattrapage.
    let eligible: boolean;
    if (targetModule.type === 'synthesis_exam') {
      eligible = !!existingProgress; // une ligne existe déjà (tentative échouée tracée)
    } else {
      const [courseForSchedule, modules] = await Promise.all([
        prisma.course.findUnique({ where: { id: enrollment.courseId }, select: { cohortStartDate: true, cohortIntervalDays: true } }),
        prisma.courseModule.findMany({
          where: { courseId: enrollment.courseId, isActive: true },
          orderBy: { order: 'asc' },
          select: { id: true, order: true, openDate: true },
        }),
      ]);
      const idx = modules.findIndex((m) => m.id === moduleId);
      const next = idx >= 0 ? modules[idx + 1] : undefined;
      const nextEffectiveOpenDate = next && courseForSchedule ? computeEffectiveOpenDate(courseForSchedule, next) : null;
      eligible = !!(nextEffectiveOpenDate && nextEffectiveOpenDate <= new Date());
    }
    if (!eligible) {
      return res.status(400).json({ error: 'not_eligible_for_rattrapage' });
    }

    const existingRequest = await prisma.rattrapageRequest.findUnique({
      where: { enrollmentId_moduleId: { enrollmentId, moduleId } },
    });
    if (existingRequest) {
      if (existingRequest.status === 'rejected') {
        const updated = await prisma.rattrapageRequest.update({
          where: { id: existingRequest.id },
          data: { status: 'pending', resolvedAt: null, resolvedBy: null, resolutionNote: null, alternateModuleId: null, requestedAt: new Date() },
        });
        return res.status(200).json({ data: updated });
      }
      return res.status(200).json({ data: existingRequest });
    }

    const created = await prisma.rattrapageRequest.create({
      data: { enrollmentId, moduleId, userId: user.id, courseId: enrollment.courseId },
    });
    res.status(201).json({ data: created });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create rattrapage request' });
  }
});

// Apprenant : mes demandes de rattrapage pour une inscription donnée.
rattrapageRequestsRouter.get('/mine/:enrollmentId', authRequired, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const enrollmentId = Number(req.params.enrollmentId);
    const enrollment = await prisma.eLearningEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    if (enrollment.userId !== user.id && user.role !== 'admin' && user.role !== 'supervisor') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const items = await prisma.rattrapageRequest.findMany({
      where: { enrollmentId },
      include: { module: { select: { title: true } }, alternateModule: { select: { id: true, title: true, quizQuestions: true } } },
    });
    res.json({ data: items });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch rattrapage requests' });
  }
});

// Admin/superviseur : liste filtrable de toutes les demandes.
rattrapageRequestsRouter.get('/', authRequired, moduleAccess('rattrapage-requests'), async (req: Request, res: Response) => {
  try {
    const { status, courseId } = req.query;
    const where: any = {};
    if (typeof status === 'string') where.status = status;
    if (typeof courseId === 'string') where.courseId = Number(courseId);

    const items = await prisma.rattrapageRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        module: { select: { id: true, title: true } },
        alternateModule: { select: { id: true, title: true } },
        enrollment: { include: { course: { select: { id: true, title: true } } } },
      },
    });
    res.json({ data: items });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch rattrapage requests' });
  }
});

// Admin/superviseur : résoudre une demande. Le rattrapage n'est pas
// forcément le même quiz — alternateModuleId permet d'assigner une
// évaluation différente, au cas par cas.
rattrapageRequestsRouter.put('/:id', authRequired, moduleAccess('rattrapage-requests'), validate(resolveSchema), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const admin = (req as any).user;
    const { status, resolutionNote, alternateModuleId } = req.body;

    const existing = await prisma.rattrapageRequest.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    let normalizedAlternateModuleId: number | null | undefined;
    if (alternateModuleId !== undefined) {
      if (alternateModuleId === null) {
        normalizedAlternateModuleId = null;
      } else {
        const altId = Number(alternateModuleId);
        const altModule = await prisma.courseModule.findUnique({ where: { id: altId } });
        if (!altModule || altModule.courseId !== existing.courseId) {
          return res.status(400).json({ error: 'alternateModuleId must belong to the same course' });
        }
        normalizedAlternateModuleId = altId;
      }
    }

    const updated = await prisma.rattrapageRequest.update({
      where: { id },
      data: {
        status,
        resolutionNote: resolutionNote ?? undefined,
        ...(normalizedAlternateModuleId !== undefined && { alternateModuleId: normalizedAlternateModuleId }),
        resolvedBy: admin.id,
        resolvedAt: new Date(),
      },
    });
    res.json({ data: updated });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to resolve rattrapage request' });
  }
});
