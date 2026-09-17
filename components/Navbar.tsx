'use client';

import Link from 'next/link';
import { useSession, signOut, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 px-6 py-4 flex items-center justify-between select-none">
      <Link href={session ? '/rep' : '/'} className="text-xl font-bold tracking-tight">
        <span className="text-white">Spatial</span>
        <span className="text-zinc-500 font-medium">Sync</span>
      </Link>

      <div>
        {session ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => signIn()}
            className="gap-2"
          >
            <LogIn className="w-3.5 h-3.5" />
            Rep Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
