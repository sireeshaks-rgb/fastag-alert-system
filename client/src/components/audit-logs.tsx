import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
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
      create: 'bg-green-500/20 text-green-400',
      update: 'bg-blue-500/20 text-blue-400',
      delete: 'bg-red-500/20 text-red-400',
      recharge: 'bg-purple-500/20 text-purple-400',
    };
    return colors[action] || 'bg-gray-500/20 text-gray-400';
  };

  if (!canViewLogs) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl p-6">
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to view audit logs. Only admins and managers can access this.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl">
        <div className="p-6 border-b border-purple-500/20">
          <h2 className="text-2xl font-bold text-white">Audit Logs</h2>
          <p className="text-gray-400 text-sm mt-1">Track all system activities and changes</p>
        </div>
        <div className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 mb-6 p-4 bg-slate-700/30 border border-purple-500/20 rounded-lg">
            <h3 className="font-semibold text-white">Filter Logs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Entity Type (e.g., vehicle, user)"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="Entity ID"
                type="number"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
              />
            </div>
            <Button onClick={fetchLogs} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              {isLoading ? 'Loading...' : 'Apply Filters'}
            </Button>
          </div>

          {isLoading ? (
            <p className="text-center text-gray-400">Loading audit logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-400">No audit logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-purple-500/20 hover:bg-slate-700/20">
                    <TableHead className="text-gray-300">Timestamp</TableHead>
                    <TableHead className="text-gray-300">Action</TableHead>
                    <TableHead className="text-gray-300">Entity Type</TableHead>
                    <TableHead className="text-gray-300">Entity ID</TableHead>
                    <TableHead className="text-gray-300">Changes</TableHead>
                    <TableHead className="text-gray-300">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id} className="border-purple-500/10 hover:bg-slate-700/30">
                      <TableCell className="text-sm text-gray-300">
                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                          {log.action.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-white">{log.entityType}</TableCell>
                      <TableCell className="text-gray-300">{log.entityId}</TableCell>
                      <TableCell className="max-w-xs">
                        {log.changes ? (
                          <code className="text-xs bg-slate-900/50 text-gray-300 p-1 rounded block overflow-auto max-h-20 border border-purple-500/20">
                            {typeof log.changes === 'string' ? log.changes : JSON.stringify(log.changes, null, 2)}
                          </code>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">{log.ipAddress || 'Unknown'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
