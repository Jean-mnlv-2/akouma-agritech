import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { api } from '@/integrations/api/client';
import { Loader2, TrendingUp, DollarSign, Star, ShoppingCart } from 'lucide-react';

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

export function AdminDashboardCharts() {
  const [data, setData] = useState<ChartStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.request('GET', '/api/stats/charts')
      .then(res => { if (mounted) setData(res.data); })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commandes (30j)</p>
              <p className="text-2xl font-bold">{data.totalOrders30d}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenus (30j)</p>
              <p className="text-2xl font-bold">{data.totalRevenue30d.toLocaleString('fr-FR')} <span className="text-sm font-normal">FCFA</span></p>
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
              <p className="text-sm text-muted-foreground">Avis (30j)</p>
              <p className="text-2xl font-bold">{data.totalReviews30d}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders & Revenue chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commandes & Revenus</CardTitle>
            <CardDescription>Évolution sur les 30 derniers jours</CardDescription>
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

        {/* Reviews & Applications line chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avis & Candidatures</CardTitle>
            <CardDescription>Tendance sur 30 jours</CardDescription>
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

        {/* Order status pie */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut des commandes</CardTitle>
              <CardDescription>Répartition sur 30 jours</CardDescription>
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

        {/* Revenue chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenus quotidiens</CardTitle>
            <CardDescription>En FCFA sur 30 jours</CardDescription>
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
