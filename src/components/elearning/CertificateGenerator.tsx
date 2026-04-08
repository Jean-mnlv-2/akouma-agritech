import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Download, QrCode, CheckCircle, Share2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import kilimoLogo from "@/assets/kilimo-logo.png";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/integrations/api/client";

interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  score: number;
  certificateNumber: string;
  // Sertifier integration
  sertifierDesignId?: string;
  sertifierDetailId?: string;
  sertifierEmailTemplateId?: string;
  studentEmail?: string;
}

interface CertificateGeneratorProps {
  data: CertificateData;
}

const CertificateGenerator = ({ data }: CertificateGeneratorProps) => {
  const { toast } = useToast();
  const [sertifierStatus, setSertifierStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [sertifierUrl, setSertifierUrl] = useState<string>('');

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    sertifierUrl || `https://kilimo-agritech.lovable.app/verify-certificate/${data.certificateNumber}`
  )}`;

  const handleIssueSertifierCertificate = async () => {
    if (!data.studentEmail || !data.sertifierDesignId || !data.sertifierDetailId || !data.sertifierEmailTemplateId) {
      toast({
        title: "Configuration manquante",
        description: "Les identifiants Sertifier (design, detail, email template) ne sont pas configurés pour ce cours.",
        variant: "destructive",
      });
      return;
    }

    setSertifierStatus('loading');
    try {
      const res = await api.request('POST', '/api/sertifier/issue-credential', {
        body: {
          recipientName: data.studentName,
          recipientEmail: data.studentEmail,
          courseName: data.courseName,
          score: data.score,
          completionDate: data.completionDate,
          designId: data.sertifierDesignId,
          detailId: data.sertifierDetailId,
          emailTemplateId: data.sertifierEmailTemplateId,
        },
      });

      setSertifierStatus('sent');
      if (res.data?.credentialUrl) {
        setSertifierUrl(res.data.credentialUrl);
      }
      toast({
        title: "🎓 Certificat Sertifier émis !",
        description: "Le certificat authentifié a été envoyé par email via Sertifier.",
      });
    } catch (e) {
      setSertifierStatus('error');
      toast({
        title: "Erreur Sertifier",
        description: e instanceof Error ? e.message : "Impossible d'émettre le certificat via Sertifier.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Erreur", description: "Impossible d'ouvrir la fenêtre d'impression. Vérifiez votre bloqueur de popups.", variant: "destructive" });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificat KILIMO - ${data.certificateNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }
          .certificate {
            width: 900px; height: 636px; background: linear-gradient(135deg, #fefefe, #f8faf8); position: relative;
            border: 3px solid #1E5B37; padding: 40px; overflow: hidden;
          }
          .certificate::before {
            content: ''; position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px;
            border: 2px solid #E57D27; pointer-events: none; border-radius: 4px;
          }
          .corner { position: absolute; width: 60px; height: 60px; }
          .corner-tl { top: 15px; left: 15px; border-top: 4px solid #1E5B37; border-left: 4px solid #1E5B37; }
          .corner-tr { top: 15px; right: 15px; border-top: 4px solid #1E5B37; border-right: 4px solid #1E5B37; }
          .corner-bl { bottom: 15px; left: 15px; border-bottom: 4px solid #1E5B37; border-left: 4px solid #1E5B37; }
          .corner-br { bottom: 15px; right: 15px; border-bottom: 4px solid #1E5B37; border-right: 4px solid #1E5B37; }
          .header { text-align: center; margin-bottom: 20px; }
          .logo { width: 60px; height: 60px; margin-bottom: 8px; }
          .org-name { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1E5B37; letter-spacing: 4px; }
          .cert-title { font-family: 'Playfair Display', serif; font-size: 36px; color: #E57D27; margin: 16px 0 8px; letter-spacing: 2px; }
          .subtitle { color: #666; font-size: 14px; }
          .student-name { font-family: 'Playfair Display', serif; font-size: 32px; color: #1E5B37; text-align: center; margin: 24px 0 8px; border-bottom: 2px solid #E57D27; display: inline-block; padding-bottom: 4px; }
          .course-name { font-size: 18px; color: #333; text-align: center; margin-bottom: 16px; font-weight: 600; }
          .details { display: flex; justify-content: center; gap: 40px; margin: 20px 0; font-size: 13px; color: #555; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; }
          .signature { text-align: center; }
          .sig-line { width: 180px; border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 12px; color: #666; }
          .qr { text-align: center; }
          .qr img { width: 80px; height: 80px; }
          .qr-label { font-size: 10px; color: #999; margin-top: 4px; }
          .cert-number { text-align: center; font-size: 11px; color: #999; margin-top: 12px; letter-spacing: 2px; }
          .sertifier-badge { text-align: center; font-size: 10px; color: #1E5B37; margin-top: 4px; }
          @media print { body { background: white; } .certificate { border: none; } }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
          <div class="header">
            <img src="${kilimoLogo}" alt="KILIMO" class="logo" crossorigin="anonymous" />
            <div class="org-name">KILIMO</div>
            <div class="cert-title">CERTIFICAT DE RÉUSSITE</div>
            <div class="subtitle">Certificate of Achievement</div>
          </div>
          <div style="text-align:center;">
            <div class="subtitle">Ce certificat est décerné à</div>
            <div class="student-name">${data.studentName}</div>
          </div>
          <div class="course-name">Pour avoir complété avec succès le cours<br/>« ${data.courseName} »</div>
          <div class="details">
            <div>📅 Date : ${new Date(data.completionDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div>📊 Score : ${data.score}%</div>
          </div>
          <div class="footer">
            <div class="signature">
              <div class="sig-line">Directeur Académique<br/>KILIMO E-Learning</div>
            </div>
            <div class="qr">
              <img src="${qrCodeUrl}" alt="QR Code" />
              <div class="qr-label">Scanner pour vérifier</div>
              ${sertifierStatus === 'sent' ? '<div class="sertifier-badge">🔒 Authentifié par Sertifier</div>' : ''}
            </div>
          </div>
          <div class="cert-number">N° ${data.certificateNumber}</div>
        </div>
        <script>setTimeout(() => window.print(), 500);</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Certificat KILIMO - ${data.courseName}`,
      text: `J'ai obtenu mon certificat KILIMO pour le cours "${data.courseName}" avec un score de ${data.score}% ! 🎓`,
      url: sertifierUrl || window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
        toast({ title: "Copié !", description: "Le lien a été copié dans le presse-papier." });
      }
    } catch { /* cancelled */ }
  };

  const hasSertifierConfig = data.sertifierDesignId && data.sertifierDetailId && data.sertifierEmailTemplateId && data.studentEmail;

  return (
    <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 via-orange-50/50 to-yellow-50 dark:from-yellow-950/20 dark:via-orange-950/10 dark:to-yellow-950/20 overflow-hidden">
      <CardContent className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-200 dark:shadow-yellow-900/20 animate-in zoom-in duration-500">
            <Award className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">🎓 Certificat obtenu !</h3>
          <p className="text-muted-foreground">Félicitations pour votre réussite</p>
        </div>

        <div className="bg-white dark:bg-card rounded-xl p-6 border border-border shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm text-muted-foreground mb-1">Décerné à</p>
              <p className="text-xl font-bold text-foreground mb-3">{data.studentName}</p>
              <p className="text-sm text-muted-foreground mb-1">Pour le cours</p>
              <p className="text-lg font-semibold text-primary mb-3">{data.courseName}</p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" /> Score : {data.score}%
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-700">
                  {new Date(data.completionDate).toLocaleDateString('fr-FR')}
                </Badge>
                {sertifierStatus === 'sent' && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Authentifié Sertifier
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <img src={qrCodeUrl} alt="QR Code de vérification" className="w-24 h-24 rounded-lg border" />
              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <QrCode className="w-3 h-3" /> Vérification
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4 font-mono">N° {data.certificateNumber}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleDownloadPDF} className="flex-1" size="lg">
            <Download className="w-5 h-5 mr-2" /> Télécharger le PDF
          </Button>
          <Button onClick={handleShare} variant="outline" size="lg">
            <Share2 className="w-5 h-5 mr-2" /> Partager
          </Button>
        </div>

        {/* Sertifier authentication */}
        {hasSertifierConfig && sertifierStatus !== 'sent' && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              onClick={handleIssueSertifierCertificate}
              variant="outline"
              size="lg"
              className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              disabled={sertifierStatus === 'loading'}
            >
              {sertifierStatus === 'loading' ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Émission en cours...</>
              ) : (
                <><ShieldCheck className="w-5 h-5 mr-2" /> Obtenir le certificat authentifié Sertifier</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Recevez un certificat vérifié et partageable via la plateforme Sertifier
            </p>
          </div>
        )}

        {sertifierStatus === 'sent' && sertifierUrl && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
            >
              <a href={sertifierUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="w-5 h-5 mr-2" /> Voir sur Sertifier
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateGenerator;
