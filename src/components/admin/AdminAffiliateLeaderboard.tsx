import { useState, useEffect } from 'react';
import { api } from '@/integrations/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, TrendingUp, Users, DollarSign } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Affiliate {
  id: number;
  code: string;
  ownerName: string | null;
  ownerEmail: string | null;
  cashbackPercent: number;
  cashbackBalance: number;
  totalCashbackEarned: number;
  usesCount: number;
  isActive: boolean;
}

export function AdminAffiliateLeaderboard() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.request('GET', '/api/promo-codes/leaderboard');
        setAffiliates(res.data || []);
      } catch { /* silent */ }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalEarned = affiliates.reduce((s, a) => s + a.totalCashbackEarned, 0);
  const totalUses = affiliates.reduce((s, a) => s + a.usesCount, 0);

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-yellow-500 text-yellow-950">🥇 1er</Badge>;
    if (index === 1) return <Badge className="bg-gray-400 text-gray-900">🥈 2e</Badge>;
    if (index === 2) return <Badge className="bg-amber-700 text-amber-100">🥉 3e</Badge>;
    return <Badge variant="outline">{index + 1}e</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Affiliés actifs</p>
              <p className="text-2xl font-bold">{affiliates.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10"><DollarSign className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total cashback généré</p>
              <p className="text-2xl font-bold">{Math.round(totalEarned).toLocaleString()} FCFA</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10"><TrendingUp className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total utilisations</p>
              <p className="text-2xl font-bold">{totalUses}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Classement des meilleurs affiliés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun affilié pour le moment</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rang</TableHead>
                  <TableHead>Affilié</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Utilisations</TableHead>
                  <TableHead className="text-right">Cashback gagné</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((a, i) => (
                  <TableRow key={a.id} className={i < 3 ? 'bg-muted/30' : ''}>
                    <TableCell>{getRankBadge(i)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{a.ownerName || '—'}</p>
                        <p className="text-xs text-muted-foreground">{a.ownerEmail || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{a.code}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{a.usesCount}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{Math.round(a.totalCashbackEarned).toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-right">{Math.round(a.cashbackBalance).toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-right">{a.cashbackPercent}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
