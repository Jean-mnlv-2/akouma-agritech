import { useEffect, useMemo, useState } from "react";
import { BarChart3, FileText, Loader2, Pencil, Plus, Power, Save, Database, Zap, RefreshCw, Trash2, Upload, Crown } from "lucide-react";
import { api } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type Plan = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number | string;
  currency: string;
  dailyProMessageLimit: number;
  hasCustomDocuments: boolean;
  hasPrioritySupport: boolean;
  hasApiAccess: boolean;
  maxCustomDocuments: number;
  trialDays: number;
  isActive: boolean;
  sortOrder: number;
};

type SubscriptionItem = {
  id: string;
  status: string;
  createdAt: string;
  user: { email: string; fullName?: string | null };
  plan: { displayName: string };
};

type AnalyticsPoint = {
  date: string;
  totalSubscribers: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  revenue: number | string;
};

type PlanForm = {
  name: string;
  displayName: string;
  description: string;
  price: string;
  currency: string;
  dailyProMessageLimit: string;
  hasCustomDocuments: boolean;
  hasPrioritySupport: boolean;
  hasApiAccess: boolean;
  maxCustomDocuments: string;
  trialDays: string;
  sortOrder: string;
  isActive: boolean;
};

type Document = {
  id: string;
  title: string;
  content: string;
  description?: string | null;
  sourceType: string;
  isActive: boolean;
  isIndexed: boolean;
  createdAt: string;
  updatedAt: string;
};

type DocumentForm = {
  title: string;
  content: string;
  description: string;
  sourceType: string;
  isActive: boolean;
};

type UserConsumption = {
  id: string;
  email: string;
  fullName?: string | null;
  totalFreeUsage: number;
  totalProUsage: number;
  totalUsage: number;
  lastActivity?: string | null;
};

const emptyPlanForm: PlanForm = {
  name: "",
  displayName: "",
  description: "",
  price: "0",
  currency: "XOF",
  dailyProMessageLimit: "10",
  hasCustomDocuments: false,
  hasPrioritySupport: false,
  hasApiAccess: false,
  maxCustomDocuments: "0",
  trialDays: "0",
  sortOrder: "0",
  isActive: true,
};

const emptyDocumentForm: DocumentForm = {
  title: "",
  content: "",
  description: "",
  sourceType: "manual",
  isActive: true,
};

function formatMoney(value: number | string): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(Number(value) || 0));
}

function planToForm(plan: Plan): PlanForm {
  return {
    name: plan.name,
    displayName: plan.displayName,
    description: plan.description || "",
    price: String(Number(plan.price) || 0),
    currency: plan.currency,
    dailyProMessageLimit: String(plan.dailyProMessageLimit),
    hasCustomDocuments: plan.hasCustomDocuments,
    hasPrioritySupport: plan.hasPrioritySupport,
    hasApiAccess: plan.hasApiAccess,
    maxCustomDocuments: String(plan.maxCustomDocuments),
    trialDays: String(plan.trialDays),
    sortOrder: String(plan.sortOrder),
    isActive: plan.isActive,
  };
}

function documentToForm(doc: Document): DocumentForm {
  return {
    title: doc.title,
    content: doc.content,
    description: doc.description || "",
    sourceType: doc.sourceType,
    isActive: doc.isActive,
  };
}

export function AdminSubscriptions() {
  const [activeTab, setActiveTab] = useState("plans");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsPoint[]>([]);
  const [summary, setSummary] = useState<{ totalSubscribers: number; totalRevenue: number }>({
    totalSubscribers: 0,
    totalRevenue: 0,
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanForm>(emptyPlanForm);

  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState<DocumentForm>(emptyDocumentForm);

  // Consumption state
  const [userConsumption, setUserConsumption] = useState<UserConsumption[]>([]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedDocId) || null,
    [documents, selectedDocId]
  );

  const refreshPlans = async () => {
    const [plansRes, subscriptionsRes, analyticsRes] = await Promise.all([
      api.request("GET", "/api/subscriptions/admin/plans"),
      api.request("GET", "/api/subscriptions/admin/subscriptions"),
      api.request("GET", "/api/subscriptions/admin/analytics"),
    ]);

    setPlans(plansRes.data || []);
    setSubscriptions(subscriptionsRes.data || []);
    setAnalytics(analyticsRes.data || []);
    setSummary(analyticsRes.summary || { totalSubscribers: 0, totalRevenue: 0 });
  };

  const refreshDocuments = async () => {
    const res = await api.request("GET", "/api/chat/admin/documents");
    setDocuments(res.data || []);
  };

  const refreshConsumption = async () => {
    const res = await api.request("GET", "/api/chat/admin/consumption/users");
    setUserConsumption(res.data || []);
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([refreshPlans(), refreshDocuments(), refreshConsumption()]);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      setPlanForm(planToForm(selectedPlan));
    } else {
      setPlanForm(emptyPlanForm);
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (selectedDocument) {
      setDocForm(documentToForm(selectedDocument));
    } else {
      setDocForm(emptyDocumentForm);
    }
  }, [selectedDocument]);

  // Plan handlers
  const handlePlanChange = (key: keyof PlanForm, value: string | boolean) => {
    setPlanForm((current) => ({ ...current, [key]: value }));
  };

  const handleSavePlan = async () => {
    try {
      setSaving(true);
      const payload = {
        name: planForm.name.trim(),
        displayName: planForm.displayName.trim(),
        description: planForm.description.trim() || undefined,
        price: Number(planForm.price),
        currency: planForm.currency.trim() || "XOF",
        dailyProMessageLimit: Number(planForm.dailyProMessageLimit),
        hasCustomDocuments: planForm.hasCustomDocuments,
        hasPrioritySupport: planForm.hasPrioritySupport,
        hasApiAccess: planForm.hasApiAccess,
        maxCustomDocuments: Number(planForm.maxCustomDocuments),
        trialDays: Number(planForm.trialDays),
        sortOrder: Number(planForm.sortOrder),
        isActive: planForm.isActive,
      };

      if (selectedPlanId) {
        await api.request("PUT", `/api/subscriptions/admin/plans/${selectedPlanId}`, { body: payload });
        toast.success("Forfait mis à jour.");
      } else {
        await api.request("POST", "/api/subscriptions/admin/plans", { body: payload });
        toast.success("Forfait créé.");
      }

      await refreshPlans();
      if (!selectedPlanId) {
        setPlanForm(emptyPlanForm);
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer le forfait.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivatePlan = async (plan: Plan) => {
    try {
      setSaving(true);
      if (plan.isActive) {
        await api.request("DELETE", `/api/subscriptions/admin/plans/${plan.id}`);
        toast.success("Forfait désactivé.");
      } else {
        await api.request("PUT", `/api/subscriptions/admin/plans/${plan.id}`, {
          body: { isActive: true },
        });
        toast.success("Forfait réactivé.");
      }
      await refreshPlans();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de modifier l'état du forfait.");
    } finally {
      setSaving(false);
    }
  };

  // Document handlers
  const handleDocChange = (key: keyof DocumentForm, value: string | boolean) => {
    setDocForm((current) => ({ ...current, [key]: value }));
  };

  const handleSaveDocument = async () => {
    try {
      setSaving(true);
      const payload = {
        title: docForm.title.trim(),
        content: docForm.content.trim(),
        description: docForm.description.trim() || undefined,
        sourceType: docForm.sourceType.trim() || "manual",
        isActive: docForm.isActive,
      };

      if (selectedDocId) {
        await api.request("PUT", `/api/chat/admin/documents/${selectedDocId}`, { body: payload });
        toast.success("Document mis à jour.");
      } else {
        await api.request("POST", "/api/chat/admin/documents", { body: payload });
        toast.success("Document créé.");
      }

      await refreshDocuments();
      if (!selectedDocId) {
        setDocForm(emptyDocumentForm);
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer le document.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;
    try {
      setSaving(true);
      await api.request("DELETE", `/api/chat/admin/documents/${doc.id}`);
      toast.success("Document supprimé.");
      await refreshDocuments();
      if (selectedDocId === doc.id) {
        setSelectedDocId(null);
        setDocForm(emptyDocumentForm);
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible de supprimer le document.");
    } finally {
      setSaving(false);
    }
  };

  const handleIndexDocument = async (doc: Document) => {
    try {
      setSaving(true);
      await api.request("POST", `/api/chat/admin/documents/${doc.id}/index`);
      toast.success("Document indexé avec succès.");
      await refreshDocuments();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'indexer le document.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncAllKnowledge = async () => {
    try {
      setSaving(true);
      await api.request("GET", "/api/chat/admin/knowledge/sync");
      toast.success("Synchronisation de la base de connaissances démarrée.");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de synchroniser la base de connaissances.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion Chatbot & Documents</h2>
        <Button variant="outline" onClick={refreshAll} disabled={saving}>
          <RefreshCw className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">
            <Crown className="mr-2 h-4 w-4" />
            Plans d'abonnement
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Database className="mr-2 h-4 w-4" />
            Documents RAG
          </TabsTrigger>
          <TabsTrigger value="consumption">
            <Zap className="mr-2 h-4 w-4" />
            Consommation
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Abonnés actifs</span>
                </div>
                <p className="text-3xl font-bold">{summary.totalSubscribers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Revenus cumulés</span>
                </div>
                <p className="text-3xl font-bold">{formatMoney(summary.totalRevenue)} FCFA</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Nouvelles souscriptions</span>
                </div>
                <p className="text-3xl font-bold">{analytics.reduce((sum, item) => sum + item.newSubscriptions, 0)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Forfaits</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPlanId(null);
                    setPlanForm(emptyPlanForm);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{plan.displayName}</p>
                          <Badge variant={plan.isActive ? "default" : "secondary"}>
                            {plan.isActive ? "actif" : "inactif"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatMoney(plan.price)} {plan.currency} · {plan.dailyProMessageLimit === 0 ? "illimité" : `${plan.dailyProMessageLimit}/jour`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedPlanId(plan.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeactivatePlan(plan)} disabled={saving}>
                          <Power className="mr-2 h-4 w-4" />
                          {plan.isActive ? "Désactiver" : "Réactiver"}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{selectedPlanId ? "Modifier le forfait" : "Créer un forfait"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Code</Label>
                  <Input id="plan-name" value={planForm.name} onChange={(e) => handlePlanChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-display-name">Libellé</Label>
                  <Input id="plan-display-name" value={planForm.displayName} onChange={(e) => handlePlanChange("displayName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-description">Description</Label>
                  <Textarea id="plan-description" value={planForm.description} onChange={(e) => handlePlanChange("description", e.target.value)} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plan-price">Prix</Label>
                    <Input id="plan-price" type="number" value={planForm.price} onChange={(e) => handlePlanChange("price", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-currency">Devise</Label>
                    <Input id="plan-currency" value={planForm.currency} onChange={(e) => handlePlanChange("currency", e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plan-limit">Quota PRO / jour</Label>
                    <Input id="plan-limit" type="number" value={planForm.dailyProMessageLimit} onChange={(e) => handlePlanChange("dailyProMessageLimit", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-docs">Documents max</Label>
                    <Input id="plan-docs" type="number" value={planForm.maxCustomDocuments} onChange={(e) => handlePlanChange("maxCustomDocuments", e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plan-trial">Jours d'essai</Label>
                    <Input id="plan-trial" type="number" value={planForm.trialDays} onChange={(e) => handlePlanChange("trialDays", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-order">Ordre</Label>
                    <Input id="plan-order" type="number" value={planForm.sortOrder} onChange={(e) => handlePlanChange("sortOrder", e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="plan-documents">Documents personnalisés</Label>
                  <Switch id="plan-documents" checked={planForm.hasCustomDocuments} onCheckedChange={(checked) => handlePlanChange("hasCustomDocuments", checked)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="plan-support">Support prioritaire</Label>
                  <Switch id="plan-support" checked={planForm.hasPrioritySupport} onCheckedChange={(checked) => handlePlanChange("hasPrioritySupport", checked)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="plan-api">Accès API</Label>
                  <Switch id="plan-api" checked={planForm.hasApiAccess} onCheckedChange={(checked) => handlePlanChange("hasApiAccess", checked)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="plan-active">Actif</Label>
                  <Switch id="plan-active" checked={planForm.isActive} onCheckedChange={(checked) => handlePlanChange("isActive", checked)} />
                </div>
                <Button className="w-full" onClick={handleSavePlan} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Souscriptions récentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {subscriptions.slice(0, 8).map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{item.user.fullName || item.user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.plan.displayName} · {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleSyncAllKnowledge} disabled={saving}>
              <RefreshCw className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              Synchroniser toute la base
            </Button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Documents RAG</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDocId(null);
                    setDocForm(emptyDocumentForm);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau document
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{doc.title}</p>
                          <Badge variant={doc.isActive ? "default" : "secondary"}>
                            {doc.isActive ? "actif" : "inactif"}
                          </Badge>
                          <Badge variant={doc.isIndexed ? "success" : "outline"}>
                            {doc.isIndexed ? "indexé" : "non indexé"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.sourceType} · Créé le {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedDocId(doc.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                        {!doc.isIndexed && (
                          <Button variant="outline" size="sm" onClick={() => handleIndexDocument(doc)} disabled={saving}>
                            <Upload className="mr-2 h-4 w-4" />
                            Indexer
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteDocument(doc)} disabled={saving}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                    {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{selectedDocId ? "Modifier le document" : "Créer un document"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-title">Titre</Label>
                  <Input id="doc-title" value={docForm.title} onChange={(e) => handleDocChange("title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-description">Description</Label>
                  <Input id="doc-description" value={docForm.description} onChange={(e) => handleDocChange("description", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-source-type">Type de source</Label>
                  <Input id="doc-source-type" value={docForm.sourceType} onChange={(e) => handleDocChange("sourceType", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-content">Contenu</Label>
                  <Textarea
                    id="doc-content"
                    value={docForm.content}
                    onChange={(e) => handleDocChange("content", e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="doc-active">Actif</Label>
                  <Switch id="doc-active" checked={docForm.isActive} onCheckedChange={(checked) => handleDocChange("isActive", checked)} />
                </div>
                <Button className="w-full" onClick={handleSaveDocument} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Consumption Tab */}
        <TabsContent value="consumption" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Consommation par utilisateur</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="text-right">Usage gratuit</TableHead>
                    <TableHead className="text-right">Usage PRO</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Dernière activité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userConsumption.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.fullName || user.email}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{user.totalFreeUsage}</TableCell>
                      <TableCell className="text-right">{user.totalProUsage}</TableCell>
                      <TableCell className="text-right font-semibold">{user.totalUsage}</TableCell>
                      <TableCell>
                        {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString("fr-FR") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
