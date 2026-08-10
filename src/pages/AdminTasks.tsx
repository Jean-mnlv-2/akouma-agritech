import { useEffect, useState } from "react";
import { api } from "@/integrations/api/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_at: string;
}

interface UserRow {
  id: string;
  email: string;
  role?: string;
}

export default function AdminTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Array<TaskRow>>([]);
  const [users, setUsers] = useState<Array<UserRow>>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await api.auth.getSession();
        if (!session) throw new Error("Session invalide");

        // Fetch users from REST API
        const { data: usersData } = await api.request('GET', '/api/users');
        const merged: Array<UserRow> = (usersData || []).map((u: any) => ({ id: u.id, email: u.email, role: u.role }));
        setUsers(merged);

        // Fetch tasks from REST API
        const { data: tasksData } = await api.request('GET', '/api/tasks');
        const list = (tasksData as Array<TaskRow>) || [];
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTasks(list);
      } catch (e) {
        console.error("AdminTasks load error:", e);
        toast({ title: "Erreur", description: "Chargement impossible", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const createTask = async () => {
    try {
      if (!title.trim()) {
        toast({ title: "Titre requis", variant: "destructive" });
        return;
      }
      await api.request('POST', '/api/tasks', {
        body: { title, description: description || null, assigned_to: assignee || null },
      });
      toast({ title: "Tâche créée" });
      setTitle("");
      setDescription("");
      setAssignee(undefined);

      // Reload tasks
      const { data: tasksData } = await api.request('GET', '/api/tasks');
      const list = (tasksData as Array<TaskRow>) || [];
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTasks(list);
    } catch (e) {
      console.error("Create task error:", e);
      toast({ title: "Erreur", description: "Création impossible", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <LoadingSpinner size="large" text="Chargement..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Créer une tâche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div>
            <Select value={assignee} onValueChange={(v) => setAssignee(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Assigner à (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={createTask}>Créer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les tâches</CardTitle>
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
