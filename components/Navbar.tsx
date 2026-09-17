'use client';

import Link from 'next/link';
import { useSession, signOut, signIn } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="bg-gray-950 border-b border-gray-800/80 px-6 py-4 flex items-center justify-between select-none">
      <Link href={session ? '/rep' : '/'} className="text-xl font-bold tracking-tight">
        <span className="text-blue-500">Spatial</span>Sync
      </Link>

      <div>
        {session ? (
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white text-xs px-4 py-2 rounded-lg border border-gray-800 transition-colors font-medium cursor-pointer"
          >
            Sign Out
          </button>
        ) : (
          <button
            onClick={() => signIn()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Rep Sign In
          </button>
        )}
      </div>
    </header>
  );
}
