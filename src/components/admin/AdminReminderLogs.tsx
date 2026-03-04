import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { api } from '@/integrations/api/client';

export function AdminReminderLogs() {
  const [emailFilter, setEmailFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: logs = [] } = useQuery({
    queryKey: ['admin', 'reminder-logs', emailFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (emailFilter) params.set('email', emailFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.request('GET', `/api/reminder_logs?${params.toString()}`);
      const items = Array.isArray(res) ? res : res.data;
      return items || [];
    },
    staleTime: 10000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal des rappels E‑Learning</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Email" value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} />
          <Input placeholder="Statut (success/failed)" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cours</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Erreur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: any) => (
              <TableRow 
                key={log.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  alert(JSON.stringify(log, null, 2));
                }}
              >
                <TableCell>{new Date(log.sentAt ?? log.createdAt).toLocaleString('fr-FR')}</TableCell>
                <TableCell>{log.email}</TableCell>
                <TableCell>{log.courseId ?? '—'}</TableCell>
                <TableCell>{log.status}</TableCell>
                <TableCell className="max-w-[300px] truncate">{log.error ?? '—'}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Aucun log</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
