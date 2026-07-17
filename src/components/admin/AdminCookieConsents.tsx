import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Trash2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ConsentRow = {
  id: string;
  userId: string | null;
  anonId: string;
  version: string;
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  method: string;
  ipHash: string | null;
  userAgent: string | null;
  url: string | null;
  locale: string | null;
  createdAt: string;
};

type StatRow = { method: string; _count: { _all: number } };

const METHOD_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  accept_all: { label: "Tout accepter", variant: "default" },
  reject_all: { label: "Tout refuser", variant: "destructive" },
  custom: { label: "Personnalisé", variant: "secondary" },
  revoked: { label: "Révoqué", variant: "outline" },
};

const PAGE_SIZE = 50;

export function AdminCookieConsents() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ConsentRow[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: PAGE_SIZE, offset };
      if (methodFilter) params.method = methodFilter;
      const res = await api.request("GET", "/api/cookie-consents", { params });
      setRows(res?.data || []);
      setTotal(Number(res?.total || 0));
      setStats(Array.isArray(res?.stats) ? res.stats : []);
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur", description: "Impossible de charger les consentements", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [offset, methodFilter, toast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cet enregistrement de consentement ?")) return;
    try {
      await api.request("DELETE", `/api/cookie-consents/${id}`);
      toast({ title: "Supprimé", description: "Enregistrement de consentement supprimé" });
      load();
    } catch (e) {
      toast({ title: "Erreur", description: "Suppression impossible", variant: "destructive" });
    }
  };

  const statsByMethod = useMemo(() => {
    const map: Record<string, number> = { accept_all: 0, reject_all: 0, custom: 0, revoked: 0 };
    stats.forEach((s) => { map[s.method] = s._count?._all || 0; });
    return map;
  }, [stats]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" aria-hidden />
            Journal des consentements aux cookies
          </CardTitle>
          <CardDescription>
            Registre RGPD/CNIL des choix effectués par les visiteurs. Conservé pour la preuve du consentement (article 7 RGPD).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["accept_all", "custom", "reject_all", "revoked"] as const).map((m) => (
              <div key={m} className="rounded-lg border bg-card p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{METHOD_LABELS[m].label}</div>
                <div className="text-2xl font-bold mt-1">{statsByMethod[m] || 0}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => { setOffset(0); setMethodFilter(e.target.value); }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filtrer par méthode"
            >
              <option value="">Toutes méthodes</option>
              <option value="accept_all">Tout accepter</option>
              <option value="reject_all">Tout refuser</option>
              <option value="custom">Personnalisé</option>
              <option value="revoked">Révoqué</option>
            </select>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">
              {total} enregistrement{total > 1 ? "s" : ""}
            </div>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Catégories</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun consentement enregistré.</TableCell></TableRow>
                ) : rows.map((r) => {
                  const meta = METHOD_LABELS[r.method] || { label: r.method, variant: "outline" as const };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">{new Date(r.createdAt).toLocaleString("fr-FR")}</TableCell>
                      <TableCell><Badge variant={meta.variant}>{meta.label}</Badge></TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary">Nécessaires</Badge>
                          {r.analytics && <Badge variant="secondary">Audience</Badge>}
                          {r.preferences && <Badge variant="secondary">Préférences</Badge>}
                          {r.marketing && <Badge variant="secondary">Marketing</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{r.userId ? r.userId.slice(0, 8) : `anon:${r.anonId.slice(0, 8)}`}</TableCell>
                      <TableCell className="text-xs">{r.version}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs" title={r.url || ""}>{r.url || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} aria-label="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Précédent</Button>
            <div className="text-xs text-muted-foreground">Page {Math.floor(offset / PAGE_SIZE) + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</div>
            <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total || loading} onClick={() => setOffset(offset + PAGE_SIZE)}>Suivant</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminCookieConsents;