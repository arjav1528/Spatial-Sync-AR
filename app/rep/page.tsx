'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function RepPortalPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 flex flex-col justify-center py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Sales Rep Portal</h1>
          <p className="text-gray-400 text-sm">Select an action to launch a live AR session or view buyer analytics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
          {/* Action Button 1: Start Session */}
          <Link
            href="/admin"
            className="group bg-gray-900 hover:bg-blue-600/10 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-8 transition-all duration-200 flex flex-col items-center text-center shadow-xl cursor-pointer"
          >
            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 border border-blue-500/30 transition-transform">
              🚀
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Start Session
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Select 3D product models, configure hotspots, and launch live synchronized AR sessions with buyers.
            </p>
          </Link>

          {/* Action Button 2: Analytics */}
          <Link
            href="/dashboard"
            className="group bg-gray-900 hover:bg-emerald-600/10 border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-8 transition-all duration-200 flex flex-col items-center text-center shadow-xl cursor-pointer"
          >
            <div className="w-16 h-16 bg-emerald-600/20 text-emerald-400 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 border border-emerald-500/30 transition-transform">
              📊
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              Analytics
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              View buyer gaze engagement heatmaps, physical proximity metrics, and session duration data.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
