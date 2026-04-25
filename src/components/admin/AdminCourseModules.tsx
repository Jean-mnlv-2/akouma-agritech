import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Edit, Trash2, Loader2, BookOpen, Video, FileText,
  Award, ChevronUp, ChevronDown, ArrowLeft
} from 'lucide-react';

interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  type: string;
  duration: string | null;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  order: number;
  isActive: boolean;
  quizQuestions: QuizQuestion[] | string | null;
}

interface Course {
  id: number;
  title: string;
  duration: number | null;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface AdminCourseModulesProps {
  initialCourseId?: number | null;
}

export function AdminCourseModules({ initialCourseId }: AdminCourseModulesProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch courses
  const { data: courses = [], isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: ['admin', 'courses-list'],
    queryFn: async () => {
      const res = await api.request('GET', '/api/courses');
      const items = Array.isArray(res) ? res : res.data;
      return (items || []).map((c: { id: number; title: string; duration?: number }) => ({ 
        id: c.id, 
        title: c.title,
        duration: c.duration || 0
      }));
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (initialCourseId && courses.length > 0) {
      const course = courses.find(c => Number(c.id) === Number(initialCourseId));
      if (course) {
        setSelectedCourse(course);
      }
    }
  }, [initialCourseId, courses]);

  // Fetch modules for selected course
  const { data: modules = [], isLoading: loadingModules } = useQuery<CourseModule[]>({
    queryKey: ['admin', 'course-modules', selectedCourse?.id],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const res = await api.request('GET', `/api/course_modules/course/${selectedCourse.id}`);
      return res.data || [];
    },
    enabled: !!selectedCourse,
    staleTime: 15000,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { data: Record<string, unknown>; id?: number }) => {
      if (payload.id) return api.request('PUT', `/api/course_modules/${payload.id}`, { body: payload.data });
      return api.request('POST', '/api/course_modules', { body: payload.data });
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: `Module ${editingModule ? 'modifié' : 'créé'}` });
      setDialogOpen(false);
      setEditingModule(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'course-modules', selectedCourse?.id] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder le module', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request('DELETE', `/api/course_modules/${id}`),
    onSuccess: () => {
      toast({ title: 'Module supprimé' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'course-modules', selectedCourse?.id] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: number; newOrder: number }) => {
      return api.request('PUT', `/api/course_modules/${id}`, { body: { order: newOrder } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course-modules', selectedCourse?.id] });
    },
  });

  const handleMoveUp = (mod: CourseModule, idx: number) => {
    if (idx === 0) return;
    const prev = modules[idx - 1];
    reorderMutation.mutate({ id: mod.id, newOrder: prev.order });
    reorderMutation.mutate({ id: prev.id, newOrder: mod.order });
  };

  const handleMoveDown = (mod: CourseModule, idx: number) => {
    if (idx >= modules.length - 1) return;
    const next = modules[idx + 1];
    reorderMutation.mutate({ id: mod.id, newOrder: next.order });
    reorderMutation.mutate({ id: next.id, newOrder: mod.order });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'quiz': return Award;
      case 'pdf': return FileText;
      default: return BookOpen;
    }
  };

  // Course selection view
  if (!selectedCourse) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Gestion des Modules de Cours
          </CardTitle>
          <CardDescription>Sélectionnez un cours pour gérer ses modules d'apprentissage</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCourses ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : courses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun cours disponible. Créez d'abord un cours.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                  onClick={() => setSelectedCourse(course)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground">Cliquez pour gérer les modules</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Modules management view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedCourse(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
            <div>
              <CardTitle className="text-lg">{selectedCourse.title}</CardTitle>
              <CardDescription>{modules.length} module(s)</CardDescription>
            </div>
          </div>
          <Button onClick={() => { setEditingModule(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nouveau Module
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingModules ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">Aucun module. Ajoutez le premier module pour ce cours.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Ordre</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((mod, idx) => {
                const TypeIcon = getTypeIcon(mod.type);
                return (
                  <TableRow key={mod.id}>
                    <TableCell>
                      <div className="flex flex-col items-center gap-0.5">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMoveUp(mod, idx)} disabled={idx === 0}>
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-mono text-muted-foreground">{mod.order}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleMoveDown(mod, idx)} disabled={idx >= modules.length - 1}>
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm">{mod.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{mod.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mod.duration || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={mod.isActive ? 'default' : 'secondary'}>
                        {mod.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => { setEditingModule(mod); setDialogOpen(true); }}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          if (confirm('Supprimer ce module ?')) deleteMutation.mutate(mod.id);
                        }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Module Dialog */}
      <ModuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        module={editingModule}
        courseId={selectedCourse.id}
        totalCourseDuration={selectedCourse.duration || 0}
        existingModules={modules}
        nextOrder={modules.length > 0 ? Math.max(...modules.map(m => m.order)) + 1 : 0}
        onSave={(data, id) => saveMutation.mutate({ data, id })}
        saving={saveMutation.isPending}
      />
    </Card>
  );
}

// Module creation/edit dialog
function ModuleDialog({
  open, onOpenChange, module, courseId, totalCourseDuration, existingModules, nextOrder, onSave, saving
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: CourseModule | null;
  courseId: number;
  totalCourseDuration: number;
  existingModules: CourseModule[];
  nextOrder: number;
  onSave: (data: Record<string, unknown>, id?: number) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('text');
  const [duration, setDuration] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const { toast } = useToast();

  const parseDuration = (dur: string | null): number => {
    if (!dur) return 0;
    const match = dur.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Reset form on open
  const resetForm = () => {
    if (module) {
      setTitle(module.title);
      setType(module.type);
      setDuration(module.duration || '');
      setContent(module.content || '');
      setVideoUrl(module.videoUrl || '');
      setPdfUrl(module.pdfUrl || '');
      setOrder(module.order);
      setIsActive(module.isActive);
      const parsed = module.quizQuestions ? (typeof module.quizQuestions === 'string' ? JSON.parse(module.quizQuestions) : module.quizQuestions) : [];
      setQuizQuestions(Array.isArray(parsed) ? parsed : []);
    } else {
      setTitle(''); setType('text'); setDuration(''); setContent('');
      setVideoUrl(''); setPdfUrl(''); setOrder(nextOrder);
      setIsActive(true); setQuizQuestions([]);
    }
  };

  // Use effect-like behavior on open change
  if (open) {
    // We need useEffect for this - simplified with key approach
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const currentModuleDuration = parseDuration(duration);
    const otherModulesDuration = existingModules
      .filter(m => m.id !== module?.id)
      .reduce((sum, m) => sum + parseDuration(m.duration), 0);

    const totalDuration = otherModulesDuration + currentModuleDuration;

    if (totalCourseDuration > 0 && totalDuration > totalCourseDuration) {
      toast({
        title: "Durée totale dépassée",
        description: `La somme des durées des modules (${totalDuration} min) ne peut pas dépasser la durée totale du cours (${totalCourseDuration} min).`,
        variant: "destructive",
      });
      return;
    }

    const data: Record<string, unknown> = {
      courseId, title: title.trim(), type, duration: duration || null,
      content: type === 'text' ? content : null,
      videoUrl: type === 'video' ? videoUrl : null,
      pdfUrl: type === 'pdf' ? pdfUrl : null,
      order, isActive,
      quizQuestions: type === 'quiz' ? quizQuestions : null,
    };
    onSave(data, module?.id);
  };

  const addQuizQuestion = () => {
    setQuizQuestions([...quizQuestions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const updateQuestion = <K extends keyof QuizQuestion>(idx: number, field: K, value: QuizQuestion[K]) => {
    const updated = [...quizQuestions];
    updated[idx][field] = value;
    setQuizQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...quizQuestions];
    updated[qIdx].options[oIdx] = value;
    setQuizQuestions(updated);
  };

  const removeQuestion = (idx: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{module ? 'Modifier le module' : 'Nouveau module'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Introduction au cours" required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">📄 Texte</SelectItem>
                  <SelectItem value="video">🎥 Vidéo</SelectItem>
                  <SelectItem value="pdf">📑 PDF</SelectItem>
                  <SelectItem value="quiz">📝 Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Durée</Label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 15 min" />
            </div>
            <div className="space-y-2">
              <Label>Ordre</Label>
              <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Module actif</Label>
          </div>

          {type === 'text' && (
            <div className="space-y-2">
              <Label>Contenu</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Contenu du module (supporte le Markdown basique)" />
            </div>
          )}

          {type === 'video' && (
            <div className="space-y-2">
              <Label>URL de la vidéo (YouTube embed)</Label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." />
            </div>
          )}

          {type === 'pdf' && (
            <div className="space-y-2">
              <Label>URL du fichier PDF</Label>
              <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />
            </div>
          )}

          {type === 'quiz' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Questions du Quiz</Label>
                <Button type="button" variant="outline" size="sm" onClick={addQuizQuestion}>
                  <Plus className="w-3 h-3 mr-1" /> Ajouter
                </Button>
              </div>
              {quizQuestions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune question. Cliquez "Ajouter" pour commencer.</p>
              )}
              {quizQuestions.map((q, qIdx) => (
                <Card key={qIdx} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Question {qIdx + 1}</Label>
                      <Input value={q.question} onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)} placeholder="Posez votre question..." />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(qIdx)} className="text-destructive mt-5">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correctAnswer === oIdx}
                          onChange={() => updateQuestion(qIdx, 'correctAnswer', oIdx)}
                          className="accent-primary"
                        />
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                          placeholder={`Option ${oIdx + 1}`}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Sélectionnez la bonne réponse avec le bouton radio</p>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {module ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
