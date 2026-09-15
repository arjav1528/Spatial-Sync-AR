'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut, signIn } from 'next-auth/react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/admin', label: 'Rep Portal' },
    { href: '/dashboard', label: 'Analytics' },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 select-none">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold flex items-center gap-1">
          <span className="text-blue-500">Spatial</span>Sync
        </Link>

        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-blue-400 font-mono bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                Rep Connected
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3.5 py-1.5 rounded-lg border border-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Rep Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
