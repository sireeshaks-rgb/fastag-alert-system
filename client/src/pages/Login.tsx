import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';

export function LoginPage() {
  const [email, setEmail] = useState('admin@fastag.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [name, setName] = useState('');
  const { login, register, user } = useAuth();

  // Debug: log when component mounts or user changes
  useEffect(() => {
    console.log('[LoginPage] User state changed:', user ? `${user.email} (${user.role})` : 'null');
    // If user is logged in, redirect to home
    if (user) {
      console.log('[LoginPage] User is logged in, redirecting to home...');
      window.location.href = '/';
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] Form submitted with email:', email);
    setError('');
    setIsLoading(true);

    try {
      console.log('[LoginPage] Calling login function...');
      await login(email, password);
      console.log('[LoginPage] Login API call completed successfully');
      // Router component will handle redirect when user state updates
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      console.error('[LoginPage] Login error:', errorMessage, err);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] Register form submitted with email:', email);
    setError('');
    setIsLoading(true);

    try {
      console.log('[LoginPage] Calling register function...');
      await register(email, password, name, 3);
      console.log('[LoginPage] Registration successful');
      // Router component will handle redirect when user state updates
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      console.error('[LoginPage] Register error:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Fastag Alert System</CardTitle>
          <CardDescription>
            {showRegister ? 'Create a new account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                {showRegister ? 'Creating account...' : 'Logging in...'}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={showRegister ? handleRegister : handleLogin} className="space-y-4">
            {showRegister && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Input
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  {showRegister ? 'Creating Account...' : 'Signing In...'}
                </span>
              ) : (
                showRegister ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">
              {showRegister ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              onClick={() => {
                setShowRegister(!showRegister);
                setError('');
                setEmail('');
                setPassword('');
                setName('');
              }}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {showRegister ? 'Sign In' : 'Register'}
            </button>
          </div>

          {!showRegister && (
            <div className="mt-6 p-4 bg-gray-50 rounded text-xs text-gray-600 space-y-1">
              <p className="font-semibold">Demo Credentials:</p>
              <p>Admin: admin@fastag.com / admin123</p>
              <p>Manager: manager@fastag.com / manager123</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
