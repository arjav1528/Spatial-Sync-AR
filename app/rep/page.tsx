'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, BarChart3 } from 'lucide-react';

export default function RepPortalPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 flex flex-col justify-center py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Sales Rep Portal</h1>
          <p className="text-zinc-400 text-sm">Select an action to launch a live AR session or view buyer analytics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
          {/* Action Button 1: Start Session */}
          <Link href="/admin" className="group block">
            <Card className="h-full border-zinc-800 bg-zinc-900/80 hover:bg-zinc-900 hover:border-zinc-500/50 transition-all duration-200 text-center p-6 cursor-pointer">
              <div className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-105 transition-transform">
                <Play className="w-7 h-7 text-white fill-current" />
              </div>
              <CardHeader className="p-0 space-y-1.5">
                <CardTitle className="text-xl group-hover:text-white transition-colors">
                  Start Session
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-zinc-400">
                  Select 3D product models, configure hotspots, and launch live synchronized AR sessions.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Action Button 2: Analytics */}
          <Link href="/dashboard" className="group block">
            <Card className="h-full border-zinc-800 bg-zinc-900/80 hover:bg-zinc-900 hover:border-zinc-500/50 transition-all duration-200 text-center p-6 cursor-pointer">
              <div className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <CardHeader className="p-0 space-y-1.5">
                <CardTitle className="text-xl group-hover:text-white transition-colors">
                  Analytics
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-zinc-400">
                  View buyer gaze engagement heatmaps, physical proximity metrics, and session duration data.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
