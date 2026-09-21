'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, KeyRound, Mail } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      // Hard redirect so the browser sends the fresh session cookie on the next request.
      // Soft navigation (router.push) races against cookie commit and causes middleware to
      // redirect back to signin inside cross-origin iframes.
      window.location.href = '/rep';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl border-zinc-800 bg-zinc-900/90 backdrop-blur">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-zinc-800 text-white rounded-full flex items-center justify-center text-xl mx-auto mb-3 border border-zinc-700">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Sales Rep Sign In</CardTitle>
          <CardDescription className="text-zinc-400">Sign in to launch sessions & view buyer analytics</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-white" />
                Rep Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rep@spatialsync.io"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-white" />
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Signing in...' : 'Sign In as Rep'}
            </Button>
          </form>

          <div className="mt-6 p-3.5 bg-zinc-950/60 rounded-lg border border-zinc-800 text-xs space-y-1">
            <p className="font-semibold text-zinc-400 mb-1">Demo Credentials:</p>
            <p className="font-mono text-zinc-400">Email: <span className="text-white font-semibold">rep@spatialsync.io</span></p>
            <p className="font-mono text-zinc-400">Password: <span className="text-white font-semibold">demo123</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
