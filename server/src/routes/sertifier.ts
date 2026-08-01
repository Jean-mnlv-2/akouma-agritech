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
    const { recipientName, recipientEmail, courseName, completionDate, designId, detailId, emailTemplateId } = req.body;

    // 1. Create campaign — champs exacts CampaignRequest : emailSubject/
    // emailFromName (mailSubject/fromName n'existent pas dans l'API et sont
    // silencieusement ignorés).
    const campaign = await sertifierRequest('POST', '/campaign', {
      title: `KILIMO - ${courseName} - ${recipientName} - ${new Date().toISOString().slice(0, 10)}`,
      designId,
      detailId,
      emailTemplateId,
      emailSubject: `Votre certificat KILIMO : ${courseName}`,
      emailFromName: 'KILIMO E-Learning',
    });

    // Sertifier enveloppe toujours dans { data, message, hasError, ... }.
    const campaignId = (campaign as any)?.data?.id || (campaign as any)?.id;

    // 2. Add credential to campaign — `campaignId` doit être DANS chaque
    // élément de `credentials` (CredentialInput.campaignId), pas à la
    // racine. `issueDate` est un champ standard documenté ; `score` n'a pas
    // d'équivalent standard et nécessiterait un Attribut personnalisé
    // Sertifier (créé via /attribute puis rattaché au Design depuis leur
    // app web) — non configuré ici, donc pas envoyé (un objet `attributes`
    // libre était silencieusement ignoré, le score n'apparaissait jamais
    // réellement sur le certificat).
    const credential: any = await sertifierRequest('POST', '/campaign/addCredentials', {
      credentials: [{
        campaignId,
        name: recipientName,
        email: recipientEmail,
        issueDate: completionDate || new Date().toISOString().slice(0, 10),
      }],
    });

    // 3. Send/publish the campaign
    await sertifierRequest('POST', '/campaign/send', { campaignId });

    // 4. Get credential details for verification URL — réponse réelle :
    // { data: { [campaignId]: [ { id, verificationLink, ... } ] } }
    let credentialUrl = '';
    let credentialId = '';
    const addedCredentials = credential?.data?.[campaignId] || credential?.[campaignId] || [];
    if (addedCredentials?.[0]) {
      credentialId = addedCredentials[0].id;
      credentialUrl = addedCredentials[0].verificationLink || '';
      try {
        const cred: any = await sertifierRequest('GET', `/credential/${credentialId}`);
        credentialUrl = cred?.data?.verificationLink || cred?.verificationLink || credentialUrl;
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
