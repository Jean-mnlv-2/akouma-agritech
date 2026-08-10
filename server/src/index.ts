import 'dotenv/config';
import express, { Request, Response, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { initSentry, Sentry } from './utils/sentry';

// Doit être initialisé avant toute autre logique applicative pour capturer
// les erreurs le plus tôt possible. No-op complet si SENTRY_DSN est absent.
initSentry();

// Filet de sécurité : en Express 4, une promesse rejetée dans un handler
// async sans try/catch ne passe pas par le middleware d'erreur — elle devient
// une "unhandled rejection" que Node (>=15) termine par défaut. Ceci évite
// qu'un oubli de try/catch dans une route ne fasse planter tout le process
// pour l'ensemble des utilisateurs. Complète, ne remplace pas, la gestion
// d'erreur locale de chaque route.
process.on('unhandledRejection', (reason) => {
  logger.error('[process] Unhandled promise rejection', reason instanceof Error ? reason.message : String(reason));
});
import { initCronJobs } from './utils/cron';
import * as deliveryService from './services/deliveryService';
import { authRouter } from './routes/auth';
import { countriesRouter } from './routes/countries';
import { seedsRouter } from './routes/seeds';
import { coursesRouter } from './routes/courses';
import { newsRouter } from './routes/news';
import { legalPagesRouter } from './routes/legalPages';
import { shopProductsRouter } from './routes/shopProducts';
import { partnershipsRouter } from './routes/partnerships';
import { partnersRouter } from './routes/partners';
import { coursePreviewTypesRouter } from './routes/coursePreviewTypes';
import { coursePreviewItemsRouter } from './routes/coursePreviewItems';
import { reminderLogsRouter } from './routes/reminderLogs';
import { chatRouter } from './routes/chat';
import { ensureCoursePreviewTypes } from './utils/seedPreviewTypes';
import { ensureDefaultPlans } from './utils/seedPlans';
import { ensureDefaultDonationImpacts } from './utils/seedDonationImpacts';
import { ensureDefaultInnovativeSolutions } from './utils/seedInnovativeSolutions';
import { donationsRouter } from './routes/donations';
import { contactMessagesRouter } from './routes/contactMessages';
import { contentSubmissionsRouter } from './routes/contentSubmissions';
import { demoRequestsRouter } from './routes/demoRequests';
import { elearningEnrollmentsRouter } from './routes/elearningEnrollments';
import { newsletterSubscriptionsRouter } from './routes/newsletterSubscriptions';
import { donationImpactsRouter } from './routes/donationImpacts';
import { innovativeSolutionsRouter } from './routes/innovativeSolutions';
import { successStoriesRouter } from './routes/successStories';
import { liveStreamsRouter } from './routes/liveStreams';
import { elearningStatsRouter } from './routes/elearningStats';
import { tasksRouter } from './routes/tasks';
import { genericRouter } from './routes/generic';
import { profilesRouter } from './routes/profiles';
import { userRolesRouter } from './routes/userRoles';
import { careersRouter } from './routes/careers';
import { jobApplicationsRouter } from './routes/jobApplications';
import { eventsRouter } from './routes/events';
import { statsRouter } from './routes/stats';
import { ordersRouter } from './routes/orders';
import { promoCodesRouter } from './routes/promoCodes';
import { deliveryPartnersRouter } from './routes/deliveryPartners';
import { deliveriesRouter } from './routes/deliveries';
import { paymentsRouter } from './routes/payments';
import { reviewsRouter } from './routes/reviews';
import { courseModulesRouter } from './routes/courseModules';
import { courseCommentsRouter } from './routes/courseComments';
import { courseSchedulesRouter } from './routes/courseSchedules';
import { rattrapageRequestsRouter } from './routes/rattrapageRequests';
import { aiSuggestionsRouter } from './routes/aiSuggestions';
import { sertifierRouter } from './routes/sertifier';
import { certificatesRouter } from './routes/certificates';
import { certificatePdfRouter } from './routes/certificatePdf';
import { pageHeaderImagesRouter } from './routes/pageHeaderImages';
import { cookieConsentsRouter } from './routes/cookieConsents';
import { subscriptionsRouter } from './routes/subscriptions';
import { meRouter } from './routes/me';
import { createRateLimiter } from './middleware/rateLimit';
import { authRequired, adminOnly } from './middleware/authRequired';
import { csrfRequired } from './middleware/csrf';
import { internalAutoNewsRouter } from './routes/internalAutoNews';
import { internalElearningRouter } from './routes/internalElearning';
import { internalEventsRouter } from './routes/internalEvents';
import { internalKnowledgeBaseRouter } from './routes/internalKnowledgeBase';
import { internalNewsScraperRouter } from './routes/internalNewsScraper';
import { phytosanitaryProductsRouter } from './routes/phytosanitaryProducts';
import { trustedSourcesRouter } from './routes/trustedSources';
import { newsScraperRouter } from './routes/newsScraper';
import { prisma } from './db';

const app = express();
app.set('trust proxy', 1);

// Configuration d'upload générique
const uploadDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

function isAllowedExtension(ext: string): boolean {
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.docx', '.xlsx'].includes(ext);
}

function looksLikeMagic(magic: Buffer, type: 'png' | 'jpg' | 'gif' | 'webp' | 'pdf' | 'zip'): boolean {
  if (type === 'png') return magic.length >= 8 && magic.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
  if (type === 'jpg') return magic.length >= 3 && magic.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]));
  if (type === 'gif') return magic.length >= 6 && (magic.subarray(0, 6).toString('ascii') === 'GIF87a' || magic.subarray(0, 6).toString('ascii') === 'GIF89a');
  if (type === 'webp') return magic.length >= 12 && magic.subarray(0, 4).toString('ascii') === 'RIFF' && magic.subarray(8, 12).toString('ascii') === 'WEBP';
  if (type === 'pdf') return magic.length >= 5 && magic.subarray(0, 5).toString('ascii') === '%PDF-';
  return magic.length >= 4 && magic.subarray(0, 4).toString('ascii') === 'PK\u0003\u0004';
}

async function validateUploadedFile(filePath: string, originalName: string, mime: string): Promise<void> {
  const ext = path.extname(originalName).toLowerCase();
  if (!isAllowedExtension(ext)) {
    throw new Error('Extension de fichier non autorisée');
  }

  const magic = await fs.promises.readFile(filePath, { encoding: null }).then((buf) => buf.subarray(0, 16));

  const isImage = mime.startsWith('image/');
  if (isImage) {
    const ok = looksLikeMagic(magic, 'png') || looksLikeMagic(magic, 'jpg') || looksLikeMagic(magic, 'gif') || looksLikeMagic(magic, 'webp');
    if (!ok) throw new Error('Fichier image invalide');
    return;
  }

  if (mime === 'application/pdf') {
    if (!looksLikeMagic(magic, 'pdf')) throw new Error('PDF invalide');
    return;
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    if (!looksLikeMagic(magic, 'zip')) throw new Error('Document Office invalide');
    return;
  }

  throw new Error('Type de fichier non autorisé');
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
      'image/', 'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedMimes.some(m => file.mimetype.startsWith(m))) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        // React/Vite uses eval in development (HMR)
        env.isDevelopment() ? "'unsafe-eval'" : undefined,
      ].filter(Boolean) as string[],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*", "http://localhost:4000", "http://127.0.0.1:4000"], // Allow HTTPS images for news, courses, products, etc.
      connectSrc: [
        "'self'",
        env.API_PUBLIC_URL,
        "http://localhost:4000",
        "http://127.0.0.1:4000",
        "https://api.resend.com",
        // Add other external API domains here as needed
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseURI: ["'none'"],
      formAction: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: env.isProduction() ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = env.FRONTEND_ORIGINS.length > 0 
    ? env.FRONTEND_ORIGINS 
    : ['http://localhost:8080', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));
// Fichiers statiques des uploads (autoriser chargement cross-origin)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.resolve(process.cwd(), 'uploads')));

// Health
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

// Root and favicon to avoid noisy 404s from browsers and previewers
app.head('/', (_req: Request, res: Response) => {
  res.sendStatus(200);
});
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'KILIMO API',
    status: 'running',
    health: '/health',
    time: new Date().toISOString(),
  });
});
app.get('/favicon.ico', (_req: Request, res: Response) => {
  res.status(204).end();
});

// Route d'upload générique
const uploadLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });
app.post('/api/upload', uploadLimiter, authRequired, adminOnly, csrfRequired, upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }
  try {
    await validateUploadedFile(file.path, file.originalname, file.mimetype);
    const relative = `/uploads/${file.filename}`;
    // URL absolue : quand frontend et backend vivent sur des domaines
    // différents (Railway, Render...), un chemin relatif comme "/uploads/x"
    // stocké en base se résout contre l'origine de la page qui l'affiche
    // (le frontend), pas contre le backend qui sert réellement le fichier
    // — 502 systématique. Le nginx proxy /uploads/ ne fonctionne qu'en
    // docker-compose local (hostname "backend" introuvable ailleurs).
    const publicUrl = `${env.API_PUBLIC_URL}${relative}`;
    res.json({ url: publicUrl, path: relative });
  } catch (e) {
    // Supprimer le fichier rejeté
    await fs.promises.unlink(file.path).catch(() => void 0);
    const msg = e instanceof Error ? e.message : 'Fichier invalide';
    res.status(400).json({ error: msg });
  }
});

// Upload public dédié aux CV de candidature : /api/upload (ci-dessus) exige
// authRequired+adminOnly, ce qui rend l'upload de CV impossible pour un
// candidat non connecté. Ce point d'entrée est volontairement restreint
// (PDF/DOCX uniquement, taille plus faible, pas d'auth requise) et
// rate-limité plus strictement pour compenser l'absence d'authentification.
const publicUploadStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const publicUpload = multer({
  storage: publicUploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé (PDF ou DOCX uniquement)'));
    }
  },
});
const publicUploadLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });
app.post('/api/upload/public', publicUploadLimiter, publicUpload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }
  try {
    await validateUploadedFile(file.path, file.originalname, file.mimetype);
    const relative = `/uploads/${file.filename}`;
    const publicUrl = `${env.API_PUBLIC_URL}${relative}`;
    res.json({ url: publicUrl, path: relative });
  } catch (e) {
    await fs.promises.unlink(file.path).catch(() => void 0);
    const msg = e instanceof Error ? e.message : 'Fichier invalide';
    res.status(400).json({ error: msg });
  }
});

// Routes
app.use('/auth', authRouter);
app.use('/api/countries', countriesRouter);
app.use('/api/seeds', seedsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/news', newsRouter);
app.use('/api/legal_pages', legalPagesRouter);
app.use('/api/shop_products', shopProductsRouter);
app.use('/api/partnerships', partnershipsRouter);
app.use('/api/partners', partnersRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/contact_messages', contactMessagesRouter);
app.use('/api/content_submissions', contentSubmissionsRouter);
app.use('/api/demo_requests', demoRequestsRouter);
app.use('/api/elearning_enrollments', elearningEnrollmentsRouter);
app.use('/api/newsletter_subscriptions', newsletterSubscriptionsRouter);
app.use('/api/donation_impacts', donationImpactsRouter);
app.use('/api/innovative_solutions', innovativeSolutionsRouter);
app.use('/api/success_stories', successStoriesRouter);
app.use('/api/live_streams', liveStreamsRouter);
app.use('/api/elearning_stats', elearningStatsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/users', profilesRouter);
app.use('/api/user_roles', userRolesRouter);
app.use('/api/careers', careersRouter);
app.use('/api/job-applications', jobApplicationsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/promo-codes', promoCodesRouter);
app.use('/api/delivery-partners', deliveryPartnersRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/course_preview_types', coursePreviewTypesRouter);
app.use('/api/course_preview_items', coursePreviewItemsRouter);
app.use('/api/course_modules', courseModulesRouter);
app.use('/api/course_comments', courseCommentsRouter);
app.use('/api/course_schedules', courseSchedulesRouter);
app.use('/api/rattrapage_requests', rattrapageRequestsRouter);
app.use('/api/ai_suggestions', aiSuggestionsRouter);
app.use('/api/reminder_logs', reminderLogsRouter);
app.use('/api/sertifier', sertifierRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/certificates', certificatePdfRouter);
app.use('/api/page_header_images', pageHeaderImagesRouter);
app.use('/api/cookie-consents', cookieConsentsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/me', meRouter);
app.use('/api', genericRouter);

// Internal API (DeerFlow only)
app.use('/api/internal/auto-news', internalAutoNewsRouter);
app.use('/api/internal/elearning', internalElearningRouter);
app.use('/api/internal/events', internalEventsRouter);
app.use('/api/internal/news-scraper', internalNewsScraperRouter);
app.use('/api/internal/knowledge-base', internalKnowledgeBaseRouter);
app.use('/api/admin/phytosanitary-products', phytosanitaryProductsRouter);
app.use('/api/admin/trusted-sources', trustedSourcesRouter);

// News Scraper Admin API
app.use('/api/admin/news-scraper', newsScraperRouter);

// Capture les erreurs pour Sentry (no-op si SENTRY_DSN absent) avant notre
// propre gestionnaire, qui reste responsable du formatage de la réponse JSON.
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Middleware de gestion d'erreur centralisée
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      // Limite variable selon le point d'upload (100MB admin, 10MB CV public).
      return res.status(400).json({ error: 'Fichier trop volumineux pour ce type d\'envoi' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err instanceof Error) {
    if (env.isProduction()) {
      // En production, ne pas exposer les détails d'erreur
      return res.status(500).json({ error: 'Erreur serveur interne' });
    }
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
  
  res.status(500).json({ error: 'Erreur serveur inconnue' });
};

app.use(errorHandler);

async function ensureDefaultAdmin() {
  if (!env.DEFAULT_ADMIN_EMAIL || !env.DEFAULT_ADMIN_PASSWORD) {
    if (env.isDevelopment()) {
      logger.warn('[auth] Default admin credentials are not fully configured.');
    }
    return;
  }

  const email = env.DEFAULT_ADMIN_EMAIL.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: env.DEFAULT_ADMIN_FULL_NAME,
        role: 'admin',
        isActive: true,
      },
    });
    logger.info(`[auth] Default admin user created (${email}).`);
    return;
  }

  if (env.DEFAULT_ADMIN_FORCE_RESET) {
    const passwordHash = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD, 12);
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        fullName: env.DEFAULT_ADMIN_FULL_NAME,
        role: 'admin',
        isActive: true,
      },
    });
    logger.info(`[auth] Default admin password updated (${email}).`);
  }
}

async function bootstrap() {
  try {
    await ensureDefaultAdmin();
    await ensureCoursePreviewTypes(prisma);
    await ensureDefaultPlans(prisma);
    await ensureDefaultDonationImpacts(prisma);
    await ensureDefaultInnovativeSolutions(prisma);
    await deliveryService.ensurePartnerExists();
    initCronJobs();
    app.listen(env.PORT, () => {
      if (env.isDevelopment()) {
        logger.info(`[server] listening on http://localhost:${env.PORT}`);
      }
    });
  } catch (error) {
    logger.error('[server] Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();


