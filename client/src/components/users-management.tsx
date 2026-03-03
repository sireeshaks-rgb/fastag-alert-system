import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit2 } from 'lucide-react';
import type { UserResponse } from '@shared/routes';

export function UsersManagement() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Check if user is admin
  const isAdmin = user?.roleId === 1;

  useEffect(() => {
    if (!isAdmin) return;

    fetchUsers();
  }, [token, isAdmin]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          roleId: 3, // Default to Driver role
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create user');
      }

      const newUser = await res.json();
      setUsers([...users, newUser]);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsAdding(false);
    }
  };

  const getRoleLabel = (roleId: number) => {
    const roles: Record<number, string> = {
      1: 'Admin',
      2: 'Manager',
      3: 'Driver',
    };
    return roles[roleId] || 'Unknown';
  };

  if (!isAdmin) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl p-6">
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to access this page. Only admins can manage users.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl">
        <div className="p-6 border-b border-purple-500/20">
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-gray-400 text-sm mt-1">Manage system users and their roles</p>
        </div>
        <div className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAddUser} className="space-y-4 mb-6 p-4 bg-slate-700/30 border border-purple-500/20 rounded-lg">
            <h3 className="font-semibold text-white">Add New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
                className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
              />
              <Input
                type="email"
                placeholder="Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
              />
              <Input
                type="password"
                placeholder="Password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
              />
            </div>
            <Button type="submit" disabled={isAdding} className="bg-purple-600 hover:bg-purple-700">
              {isAdding ? 'Adding...' : 'Add User'}
            </Button>
          </form>

          {isLoading ? (
            <p className="text-center text-gray-400">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-purple-500/20 hover:bg-slate-700/20">
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Role</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id} className="border-purple-500/10 hover:bg-slate-700/30">
                      <TableCell className="font-medium text-white">{u.name}</TableCell>
                      <TableCell className="text-gray-300">{u.email}</TableCell>
                      <TableCell className="text-gray-300">{getRoleLabel(u.roleId)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // TODO: Implement edit user
                            }}
                            className="border-purple-500/30 hover:bg-purple-500/20"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
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
