import { useState } from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/Primitives';
import { login } from '@/api/auth';
import { useAppStore } from '@/store/useAppStore';

export function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setAdminToken = useAppStore((s) => s.setAdminToken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, demo } = await login(username, password);
      if (data?.token) {
        setAdminToken(data.token);
        if (demo) setError(null);
      } else {
        setError('Invalid credentials.');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-16">
      <Card className="p-8">
        <div className="h-11 w-11 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-300 mb-4">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-base-50">Admin sign-in</h2>
        <p className="text-sm text-base-400 mt-1 mb-6">Protected routes require a JWT bearer token, issued via POST /api/auth/login.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="text-xs text-base-400 mb-1 block">
              Username
            </label>
            <input
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-base-800/70 border border-base-700 px-3 py-2.5 text-sm text-base-100 outline-none focus-visible:border-cyan-400/60"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-xs text-base-400 mb-1 block">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Any value works in demo mode"
              className="w-full rounded-lg bg-base-800/70 border border-base-700 px-3 py-2.5 text-sm text-base-100 placeholder:text-base-500 outline-none focus-visible:border-cyan-400/60"
            />
          </div>
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <Button type="submit" className="w-full" icon={LogIn} loading={loading}>
            Sign in
          </Button>
        </form>
        <Badge tone="demo" className="mt-5">
          No backend connected — any credentials sign you into the demo admin view
        </Badge>
      </Card>
    </div>
  );
}
