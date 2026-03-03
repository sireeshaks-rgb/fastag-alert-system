import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    } finally {
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl">
        <div className="p-8">
          <div className="space-y-1 mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Fastag Alert System
            </h1>
            <p className="text-gray-400 text-sm">
              {showRegister ? 'Create a new account' : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-500/20 border-red-500/30">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <Alert className="mb-4 bg-blue-500/20 border-blue-500/30">
              <AlertDescription className="text-blue-300">
                {showRegister ? 'Creating account...' : 'Logging in...'}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={showRegister ? handleRegister : handleLogin} className="space-y-4">
            {showRegister && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Name</label>
                <Input
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2" 
              disabled={isLoading}
            >
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

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">
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
              className="text-purple-400 hover:text-purple-300 font-medium disabled:opacity-50 transition-colors"
            >
              {showRegister ? 'Sign In' : 'Register'}
            </button>
          </div>

          {!showRegister && (
            <div className="mt-6 p-4 bg-slate-700/30 border border-purple-500/20 rounded-lg text-xs text-gray-300 space-y-2">
              <p className="font-semibold text-purple-300">Demo Credentials:</p>
              <div className="space-y-1 text-gray-400">
                <p>🔐 Admin: <span className="text-purple-300">admin@fastag.com</span> / <span className="text-purple-300">admin123</span></p>
                <p>🔐 Manager: <span className="text-purple-300">manager@fastag.com</span> / <span className="text-purple-300">manager123</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
