import 'dotenv/config';
import express, { Request, Response, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from './utils/env';
import { initCronJobs } from './utils/cron';
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
import { ensureCoursePreviewTypes } from './utils/seedPreviewTypes';
import { donationsRouter } from './routes/donations';
import { contactMessagesRouter } from './routes/contactMessages';
import { contentSubmissionsRouter } from './routes/contentSubmissions';
import { demoRequestsRouter } from './routes/demoRequests';
import { elearningEnrollmentsRouter } from './routes/elearningEnrollments';
import { newsletterSubscriptionsRouter } from './routes/newsletterSubscriptions';
import { donationImpactsRouter } from './routes/donationImpacts';
import { successStoriesRouter } from './routes/successStories';
import { liveStreamsRouter } from './routes/liveStreams';
import { elearningStatsRouter } from './routes/elearningStats';
import { tasksRouter } from './routes/tasks';
import { genericRouter } from './routes/generic';
import { profilesRouter } from './routes/profiles';
import { userRolesRouter } from './routes/userRoles';
import { careersRouter } from './routes/careers';
import { eventsRouter } from './routes/events';
import { statsRouter } from './routes/stats';
import { ordersRouter } from './routes/orders';
import { promoCodesRouter } from './routes/promoCodes';
import { deliveryPartnersRouter } from './routes/deliveryPartners';
import { paymentsRouter } from './routes/payments';

const app = express();
const prisma = new PrismaClient();

app.set('trust proxy', 1);

// Configuration d'upload générique
const uploadDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accepter seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
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
    name: 'AKOUMA API',
    status: 'running',
    health: '/health',
    time: new Date().toISOString(),
  });
});
app.get('/favicon.ico', (_req: Request, res: Response) => {
  res.status(204).end();
});

// Route d'upload générique
app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }
  const relative = `/uploads/${file.filename}`;
  const publicUrl = `${env.API_PUBLIC_URL}${relative}`;
  res.json({ url: publicUrl, path: relative });
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
app.use('/api/success_stories', successStoriesRouter);
app.use('/api/live_streams', liveStreamsRouter);
app.use('/api/elearning_stats', elearningStatsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/users', profilesRouter);
app.use('/api/user_roles', userRolesRouter);
app.use('/api/careers', careersRouter);
app.use('/api/events', eventsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/promo-codes', promoCodesRouter);
app.use('/api/delivery-partners', deliveryPartnersRouter);
app.use('/api/course_preview_types', coursePreviewTypesRouter);
app.use('/api/course_preview_items', coursePreviewItemsRouter);
app.use('/api/reminder_logs', reminderLogsRouter);
app.use('/api', genericRouter);

// Middleware de gestion d'erreur centralisée
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux (maximum 5MB)' });
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
      console.warn('[auth] Default admin credentials are not fully configured.');
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
    console.log(`[auth] Default admin user created (${email}).`);
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
    console.log(`[auth] Default admin password updated (${email}).`);
  }
}

async function bootstrap() {
  try {
    await ensureDefaultAdmin();
    await ensureCoursePreviewTypes(prisma);
    initCronJobs();
    app.listen(env.PORT, () => {
      if (env.isDevelopment()) {
        console.log(`[server] listening on http://localhost:${env.PORT}`);
      }
    });
  } catch (error) {
    console.error('[server] Failed to start application:', error);
    process.exit(1);
  }
}

void bootstrap();


