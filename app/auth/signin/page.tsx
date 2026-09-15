'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
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
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 border border-blue-500/30">
            💼
          </div>
          <h1 className="text-2xl font-bold text-white">Sales Rep Sign In</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in as Sales Rep to upload assets & start sessions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1 font-medium">Rep Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rep@spatialsync.io"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Signing in...' : 'Sign In as Rep'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-950/60 rounded-lg border border-gray-800/80">
          <p className="text-xs text-gray-400 font-semibold mb-1">Demo Credentials:</p>
          <p className="text-xs font-mono text-gray-400">Email: <span className="text-blue-400">rep@spatialsync.io</span></p>
          <p className="text-xs font-mono text-gray-400">Password: <span className="text-blue-400">demo123</span></p>
          <p className="text-[11px] text-gray-500 mt-2">Viewers scan QR code directly — no sign-in required!</p>
        </div>
      </div>
    </div>
  );
}
