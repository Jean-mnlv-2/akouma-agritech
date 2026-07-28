import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/integrations/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import CertificateGenerator from '@/components/elearning/CertificateGenerator';
import { SEO } from '@/components/SEO';

interface Course {
  id: number;
  title: string;
  sertifierDesignId?: string;
  sertifierDetailId?: string;
  sertifierEmailTemplateId?: string;
}

const AdminCertificatePreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('Aïcha NIANG');
  const [studentEmail, setStudentEmail] = useState('etudiant@example.com');
  const [score, setScore] = useState(92);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.request('GET', `/api/courses/${id}`);
        setCourse(res?.data || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (!course) {
    return (
      <div className="container mx-auto p-8">
        <p>Cours introuvable.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/admin">Retour</Link></Button>
      </div>
    );
  }

  const sertifierReady = !!(course.sertifierDesignId && course.sertifierDetailId && course.sertifierEmailTemplateId);

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`Aperçu certificat — ${course.title}`} description="" noindex />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" /> Retour</Button>
          <h1 className="text-2xl font-bold">Aperçu du certificat</h1>
          {sertifierReady ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300"><ShieldCheck className="w-3 h-3 mr-1" /> Sertifier configuré</Badge>
          ) : (
            <Badge variant="destructive"><ShieldAlert className="w-3 h-3 mr-1" /> Sertifier non configuré</Badge>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Données de simulation</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nom de l'étudiant</Label>
              <Input value={studentName} onChange={e => setStudentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Score (%)</Label>
              <Input type="number" min={0} max={100} value={score} onChange={e => setScore(Number(e.target.value) || 0)} />
            </div>
          </CardContent>
        </Card>

        <CertificateGenerator
          data={{
            studentName,
            studentEmail,
            courseName: course.title,
            completionDate: new Date().toISOString(),
            score,
            certificateNumber: `KLM-PREVIEW-${course.id}`,
            sertifierDesignId: course.sertifierDesignId,
            sertifierDetailId: course.sertifierDetailId,
            sertifierEmailTemplateId: course.sertifierEmailTemplateId,
          }}
        />

        <p className="text-xs text-muted-foreground mt-4 text-center">
          ⚠️ Ceci est une prévisualisation. Aucun certificat n'est réellement émis tant que vous ne déclenchez pas l'émission depuis le dashboard étudiant ou la file d'attente admin.
        </p>
      </div>
    </div>
  );
};

export default AdminCertificatePreview;
