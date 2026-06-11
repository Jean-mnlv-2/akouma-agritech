import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authRequired, adminOnly } from '../middleware/authRequired';
import { validate } from '../middleware/validate';
import { audit, actorFromRequest } from '../utils/audit';
import { sertifierFetch as sertifierRequest, isSertifierConfigured } from '../utils/sertifierClient';

export const sertifierRouter = Router();

const issueCredentialSchema = z.object({
  recipientName: z.string().min(1).max(255),
  recipientEmail: z.string().email().max(320),
  courseName: z.string().min(1).max(255),
  score: z.union([z.number().min(0).max(100), z.string()]).optional(),
  completionDate: z.string().max(40).optional(),
  designId: z.string().min(1).max(64),
  detailId: z.string().min(1).max(64),
  emailTemplateId: z.string().min(1).max(64),
}).strict();

// Guard: short-circuit when Sertifier is not configured to avoid noisy 500s
sertifierRouter.use((req, res, next) => {
  if (!isSertifierConfigured()) {
    return res.status(503).json({
      error: 'Sertifier non configuré. Définissez SERTIFIER_SECRET_KEY côté serveur.',
      configured: false,
      connected: false,
    });
  }
  next();
});

// Test authentication
sertifierRouter.get('/test', authRequired, adminOnly, async (_req: Request, res: Response) => {
  try {
    const result = await sertifierRequest('GET', '/Test');
    res.json({ data: result, connected: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Sertifier connection failed', connected: false });
  }
});

// Issue a credential: create campaign, add credential, and publish
sertifierRouter.post('/issue-credential', authRequired, adminOnly, validate(issueCredentialSchema), async (req: Request, res: Response) => {
  try {
    const { recipientName, recipientEmail, courseName, score, completionDate, designId, detailId, emailTemplateId } = req.body;

    // 1. Create campaign
    const campaign = await sertifierRequest('POST', '/campaign', {
      title: `KILIMO - ${courseName} - ${recipientName} - ${new Date().toISOString().slice(0, 10)}`,
      designId,
      detailId,
      emailTemplateId,
      mailSubject: `Votre certificat KILIMO : ${courseName}`,
      fromName: 'KILIMO E-Learning',
    });

    const campaignId = campaign.id;

    // 2. Add credential to campaign
    const credential = await sertifierRequest('POST', '/campaign/addCredentials', {
      campaignId,
      credentials: [{
        name: recipientName,
        email: recipientEmail,
        attributes: {
          courseName,
          score: score ? `${score}%` : 'N/A',
          completionDate: completionDate || new Date().toISOString().slice(0, 10),
          platform: 'KILIMO E-Learning',
        },
      }],
    });

    // 3. Send/publish the campaign
    await sertifierRequest('POST', '/campaign/send', { campaignId });

    // 4. Get credential details for verification URL
    let credentialUrl = '';
    let credentialId = '';
    if (credential?.credentials?.[0]) {
      credentialId = credential.credentials[0].id;
      try {
        const cred = await sertifierRequest('GET', `/credential/${credentialId}`);
        credentialUrl = cred.verificationUrl || cred.url || '';
      } catch {
        // Credential might not be ready yet
      }
    }

    res.json({
      data: {
        campaignId,
        credentialId,
        credentialUrl,
        status: 'sent',
      },
    });
    audit({ ...actorFromRequest(req), action: 'sertifier.issue', entityType: 'certificate', entityId: credentialId || campaignId, metadata: { recipientEmail, courseName } }).catch(() => {});
  } catch (e) {
    console.error('[Sertifier] Issue credential error:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to issue credential' });
  }
});

// Search credentials
sertifierRouter.post('/credentials/search', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const result = await sertifierRequest('POST', '/credential/search', req.body);
    res.json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Search failed' });
  }
});

// Get credential by ID
sertifierRouter.get('/credential/:id', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const result = await sertifierRequest('GET', `/credential/${req.params.id}`);
    res.json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Not found' });
  }
});

// Generate PDF link for credential
sertifierRouter.get('/credential/:id/pdf', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const result = await sertifierRequest('GET', `/credential/generatePDFLink/${req.params.id}`);
    res.json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'PDF generation failed' });
  }
});

// Search designs
sertifierRouter.post('/designs/search', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const result = await sertifierRequest('POST', '/design/search', req.body || {});
    res.json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Search failed' });
  }
});

// Search details
sertifierRouter.post('/details/search', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const result = await sertifierRequest('POST', '/detail/search', req.body || {});
    res.json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Search failed' });
  }
});

// Search email templates
sertifierRouter.post('/email-templates/search', authRequired, adminOnly, async (req: Request, res: Response) => {
  try {
    const result = await sertifierRequest('POST', '/emailTemplate/search', req.body || {});
    res.json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Search failed' });
  }
});
