import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { api } from '@/integrations/api/client';
import { Loader2, TrendingUp, DollarSign, Star, ShoppingCart, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ChartStats {
  chartData: { date: string; orders: number; revenue: number; reviews: number; applications: number }[];
  totalRevenue30d: number;
  ordersByStatus: Record<string, number>;
  avgRating: number;
  totalOrders30d: number;
  totalReviews30d: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(var(--chart-1, 220 70% 50%))',
  confirmed: 'hsl(var(--chart-2, 160 60% 45%))',
  shipped: 'hsl(var(--chart-3, 30 80% 55%))',
  delivered: 'hsl(var(--chart-4, 280 65% 60%))',
  cancelled: 'hsl(var(--chart-5, 340 75% 55%))',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const chartConfig = {
  orders: { label: 'Commandes', color: 'hsl(var(--primary))' },
  revenue: { label: 'Revenus', color: 'hsl(var(--chart-2, 160 60% 45%))' },
  reviews: { label: 'Avis', color: 'hsl(var(--chart-3, 30 80% 55%))' },
  applications: { label: 'Candidatures', color: 'hsl(var(--chart-4, 280 65% 60%))' },
};

type PeriodDays = '7' | '30' | '90';

export function AdminDashboardCharts() {
  const [data, setData] = useState<ChartStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodDays>('30');
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback((days: PeriodDays) => {
    setLoading(true);
    api.request('GET', '/api/stats/charts', { params: { days } })
      .then((res: { data: ChartStats }) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  const handlePeriodChange = (val: string) => {
    if (val) setPeriod(val as PeriodDays);
  };

  const exportCSV = () => {
    if (!data) return;
    const header = 'Date,Commandes,Revenus,Avis,Candidatures\n';
    const rows = data.chartData.map(r => `${r.date},${r.orders},${r.revenue},${r.reviews},${r.applications}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statistiques-KILIMO-${period}j.csv`;
    link.click();
  };

  const exportPDF = async () => {
    if (!data || exporting) return;
    setExporting(true);
    try {
      const res = await api.request('GET', '/api/stats/export-pdf', { params: { days: period } });
      // If server returns a PDF URL or base64
      if (res.url) {
        window.open(res.url, '_blank');
      } else {
        // Fallback: generate a simple printable page
        const totalOrdersForPeriod = data.chartData.reduce((acc, cur) => acc + cur.orders, 0);
        const totalRevenueForPeriod = data.chartData.reduce((acc, cur) => acc + cur.revenue, 0);
        const totalReviewsForPeriod = data.chartData.reduce((acc, cur) => acc + cur.reviews, 0);

        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
          <html><head><title>Statistiques KILIMO - ${period} jours</title>
          <style>body{font-family:system-ui;padding:40px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.summary{display:flex;gap:20px;margin-bottom:20px}.card{padding:16px;border:1px solid #ddd;border-radius:8px;flex:1;text-align:center}.card h3{margin:0;font-size:24px}.card p{margin:4px 0 0;color:#666}</style></head><body>
          <h1>Statistiques KILIMO Agritech — ${period} derniers jours</h1>
          <div class="summary">
            <div class="card"><h3>${totalOrdersForPeriod}</h3><p>Commandes</p></div>
            <div class="card"><h3>${totalRevenueForPeriod.toLocaleString('fr-FR')} FCFA</h3><p>Revenus</p></div>
            <div class="card"><h3>${data.avgRating}/5</h3><p>Note moyenne</p></div>
            <div class="card"><h3>${totalReviewsForPeriod}</h3><p>Avis</p></div>
          </div>
          <table><thead><tr><th>Date</th><th>Commandes</th><th>Revenus (FCFA)</th><th>Avis</th><th>Candidatures</th></tr></thead><tbody>
          ${data.chartData.map(r => `<tr><td>${r.date}</td><td>${r.orders}</td><td>${r.revenue.toLocaleString('fr-FR')}</td><td>${r.reviews}</td><td>${r.applications}</td></tr>`).join('')}
          </tbody></table>
          </body></html>
        `);
        win.document.close();
        win.print();
      }
    } catch {
      // Fallback to CSV
      exportCSV();
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const pieData = Object.entries(data.ordersByStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    fill: STATUS_COLORS[status] || 'hsl(var(--muted))',
  }));

  const periodLabel = period === '7' ? '7 jours' : period === '30' ? '30 jours' : '90 jours';

  return (
    <div className="space-y-6">
      {/* Period filter & Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <ToggleGroup type="single" value={period} onValueChange={handlePeriodChange} className="bg-muted rounded-lg p-1">
          <ToggleGroupItem value="7" className="text-sm px-4">7j</ToggleGroupItem>
          <ToggleGroupItem value="30" className="text-sm px-4">30j</ToggleGroupItem>
          <ToggleGroupItem value="90" className="text-sm px-4">90j</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel/CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting}>
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commandes ({periodLabel})</p>
              <p className="text-2xl font-bold">{data.chartData.reduce((s, i) => s + i.orders, 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenus ({periodLabel})</p>
              <p className="text-2xl font-bold">{data.chartData.reduce((s, i) => s + i.revenue, 0).toLocaleString('fr-FR')} <span className="text-sm font-normal">FCFA</span></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Note moyenne</p>
              <p className="text-2xl font-bold">{data.avgRating}/5</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avis ({periodLabel})</p>
              <p className="text-2xl font-bold">{data.chartData.reduce((s, i) => s + i.reviews, 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commandes & Revenus</CardTitle>
            <CardDescription>Évolution sur les {periodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tickFormatter={formatDate} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avis & Candidatures</CardTitle>
            <CardDescription>Tendance sur {periodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="reviews" stroke="var(--color-reviews)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="applications" stroke="var(--color-applications)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut des commandes</CardTitle>
              <CardDescription>Répartition sur {periodLabel}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ChartContainer config={chartConfig} className="h-[250px] w-full max-w-[300px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenus quotidiens</CardTitle>
            <CardDescription>En FCFA sur {periodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
