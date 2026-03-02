import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AuditLogResponse } from '@shared/routes';
import { format } from 'date-fns';

export function AuditLogs() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');

  // Check if user can view audit logs (Admin or Manager)
  const canViewLogs = user?.roleId === 1 || user?.roleId === 2;

  useEffect(() => {
    if (!canViewLogs) return;
    fetchLogs();
  }, [token, canViewLogs, entityType, entityId]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const url = new URL('/api/audit-logs', window.location.origin);
      if (entityType) url.searchParams.append('entityType', entityType);
      if (entityId) url.searchParams.append('entityId', entityId);

      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      recharge: 'bg-purple-100 text-purple-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (!canViewLogs) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>
              You don't have permission to view audit logs. Only admins and managers can access this.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Track all system activities and changes</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold">Filter Logs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Entity Type (e.g., vehicle, user)"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
              />
              <Input
                placeholder="Entity ID"
                type="number"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              />
            </div>
            <Button onClick={fetchLogs} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Apply Filters'}
            </Button>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading audit logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground">No audit logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                          {log.action.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{log.entityType}</TableCell>
                      <TableCell>{log.entityId}</TableCell>
                      <TableCell className="max-w-xs">
                        {log.changes ? (
                          <code className="text-xs bg-muted p-1 rounded block overflow-auto max-h-20">
                            {typeof log.changes === 'string' ? log.changes : JSON.stringify(log.changes, null, 2)}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{log.ipAddress || 'Unknown'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
