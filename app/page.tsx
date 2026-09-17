'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/rep');
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 flex flex-col justify-center items-center text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
          <span className="text-blue-500">Spatial</span>Sync <span className="text-gray-500 text-3xl md:text-5xl">AR</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10 leading-relaxed">
          Real-time multi-device spatial 3D product pitches & buyer gaze analytics.
        </p>

        <div>
          <Link
            href="/auth/signin"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-blue-600/25 inline-flex items-center gap-2 cursor-pointer"
          >
            <span>💼</span> Sales Rep Login
          </Link>
        </div>
      </main>
    </div>
  );
}
