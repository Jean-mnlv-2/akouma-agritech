import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Download, QrCode, CheckCircle } from "lucide-react";
import logoAk from "@/assets/logo-ak.png";

interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  score: number;
  certificateNumber: string;
}

interface CertificateGeneratorProps {
  data: CertificateData;
}

const CertificateGenerator = ({ data }: CertificateGeneratorProps) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    `https://KILIMO-agritech.lovable.app/verify-certificate/${data.certificateNumber}`
  )}`;

  const handleDownloadPDF = () => {
    // Generate a printable certificate in a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
            width: 900px; height: 636px; background: white; position: relative;
            border: 3px solid #1E5B37; padding: 40px; overflow: hidden;
          }
          .certificate::before {
            content: ''; position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px;
            border: 2px solid #E57D27; pointer-events: none;
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
            <img src="${logoAk}" alt="KILIMO" class="logo" crossorigin="anonymous" />
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

  return (
    <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 via-orange-50/50 to-yellow-50 dark:from-yellow-950/20 dark:via-orange-950/10 dark:to-yellow-950/20 overflow-hidden">
      <CardContent className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">🎓 Certificat obtenu !</h3>
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
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" /> Score : {data.score}%
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  {new Date(data.completionDate).toLocaleDateString('fr-FR')}
                </Badge>
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

        <Button onClick={handleDownloadPDF} className="w-full" size="lg">
          <Download className="w-5 h-5 mr-2" /> Télécharger le certificat PDF
        </Button>
      </CardContent>
    </Card>
  );
};

export default CertificateGenerator;
