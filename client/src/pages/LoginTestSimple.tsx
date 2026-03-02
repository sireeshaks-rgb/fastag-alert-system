import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginTestSimple() {
  const [email, setEmail] = useState('admin@fastag.com');
  const [password, setPassword] = useState('admin123');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setError('');
    setResult(null);
    setIsLoading(true);

    try {
      console.log('[TEST] Sending login request to /api/auth/login');
      console.log('[TEST] Email:', email);
      console.log('[TEST] Password:', password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('[TEST] Response status:', response.status);
      console.log('[TEST] Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('[TEST] Response body:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setResult({
        success: true,
        user: data.user,
        token: data.token?.substring(0, 30) + '...',
      });

      // Store in localStorage
      localStorage.setItem('fastag_auth_token', data.token);
      localStorage.setItem('fastag_user', JSON.stringify(data.user));
      console.log('[TEST] Stored in localStorage');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TEST] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <Button onClick={handleTest} disabled={isLoading} className="w-full">
            {isLoading ? 'Testing...' : 'Test Login'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm space-y-2">
              <p><strong>✓ Login Successful!</strong></p>
              <p><strong>User:</strong> {result.user.email}</p>
              <p><strong>Name:</strong> {result.user.name}</p>
              <p><strong>Role ID:</strong> {result.user.roleId}</p>
              <p><strong>Token:</strong> {result.token}</p>
              <p className="text-xs text-gray-600 mt-2">
                Open the browser console (F12) to see detailed logs
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            <p>Open F12 (Developer Console) to see detailed logs of what's happening</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
