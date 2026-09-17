'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/rep');
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 flex flex-col justify-center items-center text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
          <span className="text-white">Spatial</span>
          <span className="text-zinc-500 font-medium">Sync</span>{' '}
          <span className="text-zinc-500 font-medium text-3xl md:text-5xl">AR</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mb-10 leading-relaxed">
          Real-time multi-device spatial 3D product pitches & buyer gaze analytics.
        </p>

        <Button asChild size="lg" className="gap-2">
          <Link href="/auth/signin">
            <LogIn className="w-4 h-4" />
            Sales Rep Login
          </Link>
        </Button>
      </main>
    </div>
  );
}
