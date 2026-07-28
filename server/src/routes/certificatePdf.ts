import { Router, Request, Response } from 'express';
import { authRequired } from '../middleware/authRequired';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { prisma } from '../db';
export const certificatePdfRouter = Router();

function publicBase(req: Request): string {
  const env = (process.env.FRONTEND_ORIGINS || '').split(',')[0].trim();
  if (env) return env.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

async function buildPdf(res: Response, cert: any, course: any, user: any, verifyUrl: string) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 50,
    info: {
      Title: `Certificat KILIMO - ${course.title}`,
      Author: 'KILIMO Agritech',
      Subject: 'Certificat de réussite',
      Keywords: 'kilimo,certificate,e-learning',
      CreationDate: new Date(cert.completionDate),
    },
    pdfVersion: '1.7',
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificat-${cert.certificateNumber}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width;
  const H = doc.page.height;

  // Border
  doc.lineWidth(4).strokeColor('#1E5B37').rect(25, 25, W - 50, H - 50).stroke();
  doc.lineWidth(1).strokeColor('#E57D27').rect(40, 40, W - 80, H - 80).stroke();

  // Header
  doc.fillColor('#1E5B37').font('Helvetica-Bold').fontSize(14).text('KILIMO AGRITECH — E-LEARNING', 0, 70, { align: 'center', width: W });
  doc.moveDown(0.3);
  doc.fillColor('#111').font('Helvetica-Bold').fontSize(42).text('CERTIFICAT DE RÉUSSITE', 0, 110, { align: 'center', width: W });

  doc.font('Helvetica').fontSize(14).fillColor('#374151').text('Ce certificat atteste que', 0, 180, { align: 'center', width: W });

  doc.font('Helvetica-Bold').fontSize(32).fillColor('#1E5B37').text(user.fullName || user.email, 0, 210, { align: 'center', width: W });

  doc.font('Helvetica').fontSize(14).fillColor('#374151').text('a complété avec succès la formation', 0, 270, { align: 'center', width: W });

  doc.font('Helvetica-Bold').fontSize(22).fillColor('#111').text(course.title, 60, 300, { align: 'center', width: W - 120 });

  if (cert.score != null) {
    doc.font('Helvetica').fontSize(13).fillColor('#374151').text(`Score obtenu : ${cert.score}%`, 0, 360, { align: 'center', width: W });
  }

  const dateStr = new Date(cert.completionDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.font('Helvetica').fontSize(12).fillColor('#6b7280').text(`Délivré le ${dateStr}`, 0, 385, { align: 'center', width: W });

  // Footer left: signature line
  doc.moveTo(80, H - 110).lineTo(280, H - 110).strokeColor('#9ca3af').lineWidth(1).stroke();
  doc.fontSize(11).fillColor('#374151').text('Direction KILIMO E-Learning', 80, H - 105, { width: 200, align: 'center' });

  // Footer center: certificate number
  doc.fontSize(10).fillColor('#6b7280').text(`N° ${cert.certificateNumber}`, 0, H - 80, { align: 'center', width: W });
  doc.fontSize(9).fillColor('#9ca3af').text(`Vérification : ${verifyUrl}`, 0, H - 65, { align: 'center', width: W });

  // QR code right
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200, color: { dark: '#1E5B37', light: '#ffffff' } });
    const b64 = qrDataUrl.split(',')[1];
    doc.image(Buffer.from(b64, 'base64'), W - 170, H - 170, { width: 100 });
    doc.fontSize(9).fillColor('#374151').text('Scanner pour vérifier', W - 175, H - 65, { width: 110, align: 'center' });
  } catch { /* ignore qr failure */ }

  doc.end();
}

// Public verification (no auth)
certificatePdfRouter.get('/verify/:number', async (req: Request, res: Response) => {
  try {
    const number = String(req.params.number);
    const cert = await prisma.certificate.findUnique({
      where: { certificateNumber: number },
      include: {
        user: { select: { fullName: true } },
        course: { select: { title: true } },
      },
    });
    if (!cert) return res.status(404).json({ valid: false });
    res.json({
      valid: true,
      data: {
        certificateNumber: cert.certificateNumber,
        studentName: cert.user?.fullName || 'Apprenant KILIMO',
        courseTitle: cert.course?.title,
        completionDate: cert.completionDate,
        score: cert.score,
        issuedAt: cert.issuedAt,
      },
    });
  } catch (e) {
    res.status(500).json({ valid: false, error: 'lookup failed' });
  }
});

// Download PDF (owner or admin)
certificatePdfRouter.get('/:id/pdf', authRequired, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const u = (req as any).user;
    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: { course: true, user: true },
    });
    if (!cert) return res.status(404).json({ error: 'Not found' });
    if (cert.userId !== u.id && u.role !== 'admin' && u.role !== 'supervisor') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const verifyUrl = `${publicBase(req)}/certificates/verify/${encodeURIComponent(cert.certificateNumber)}`;
    await buildPdf(res, cert, cert.course, cert.user, verifyUrl);
  } catch (e) {
    console.error('[Certificates] PDF error:', e);
    if (!res.headersSent) res.status(500).json({ error: 'PDF generation failed' });
  }
});