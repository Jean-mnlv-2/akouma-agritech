import { useEffect, useState } from "react";
import { api } from "@/integrations/api/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export default function Supervisor() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Array<TaskRow>>([]);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await api.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) throw new Error("Session invalide");

        const res = await fetch('/api/tasks', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch tasks');
        const { data } = await res.json();

        const list = (data as Array<TaskRow>) || [];
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTasks(list);
      } catch (e) {
        console.error("Load tasks error:", e);
        toast({ title: "Erreur", description: "Impossible de charger les tâches", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <LoadingSpinner size="large" text="Chargement des tâches..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tâches qui vous sont assignées</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-sm text-muted-foreground">Aucune tâche.</div>
          ) : (
            <ul className="space-y-3">
              {tasks.map(t => (
                <li key={t.id} className="border p-3 rounded">
                  <div className="font-medium">{t.title}</div>
                  {t.description && (
                    <div className="text-sm text-muted-foreground mt-1">{t.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">{new Date(t.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}















