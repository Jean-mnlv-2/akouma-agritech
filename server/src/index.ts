import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { countriesRouter } from './routes/countries';
import { seedsRouter } from './routes/seeds';
import { coursesRouter } from './routes/courses';
import { newsRouter } from './routes/news';
import { legalPagesRouter } from './routes/legalPages';
import { shopProductsRouter } from './routes/shopProducts';
import { partnershipsRouter } from './routes/partnerships';
import { partnersRouter } from './routes/partners';
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

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8080';
const API_PUBLIC_URL = process.env.API_PUBLIC_URL || `http://localhost:${PORT}`;

// Configuration d'upload générique
const uploadDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req: any, file: any, cb: any) => {
    // Accepter seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

app.use(helmet({
  // Allow resources like images to be loaded cross-origin (frontend 8080 -> backend 4000)
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  origin: ['http://localhost:8080', 'http://localhost:5173'], 
  credentials: true 
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

// Route d'upload générique
app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  const file = (req as any).file;
  if (!file) {
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }
  const relative = `/uploads/${file.filename}`;
  const publicUrl = `${API_PUBLIC_URL}${relative}`;
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
app.use('/api/user_roles', userRolesRouter);
app.use('/api/careers', careersRouter);
app.use('/api/events', eventsRouter);
app.use('/api/stats', statsRouter);
app.use('/api', genericRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${PORT}`);
});


