'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import HeatmapOverlay from '@/components/HeatmapOverlay';

interface AnalyticsVector {
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
  timestamp: number;
  userId: string;
}

export default function DashboardPage() {
  const [sessionId, setSessionId] = useState('');
  const [vectors, setVectors] = useState<AnalyticsVector[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState('/models/demo.glb');

  const fetchAnalytics = async () => {
    if (!sessionId.trim()) return;
    setLoading(true);
    try {
      const [analyticsRes, sessionRes] = await Promise.all([
        fetch(`/api/analytics?sessionId=${sessionId}`),
        fetch(`/api/session?id=${sessionId}`).catch(() => null),
      ]);

      const analyticsData = await analyticsRes.json();
      setVectors(analyticsData.vectors || []);

      if (sessionRes && sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.assetUrl || sessionData.session?.assetUrl) {
          setModelUrl(sessionData.assetUrl || sessionData.session?.assetUrl);
        } else if (sessionData.session?.assetKey) {
          setModelUrl(`https://${process.env.NEXT_PUBLIC_S3_BUCKET || ''}.s3.amazonaws.com/${sessionData.session.assetKey}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const avgProximity =
    vectors.length > 0
      ? (vectors.reduce((sum, v) => sum + Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2), 0) / vectors.length).toFixed(2)
      : '0';

  const sessionDuration =
    vectors.length > 1
      ? ((vectors[vectors.length - 1].timestamp - vectors[0].timestamp) / 1000).toFixed(0)
      : '0';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Spatial Analytics Dashboard</h1>
        <p className="text-gray-400 mb-8">View engagement heatmaps and gaze analytics for past sessions.</p>

        {/* Session Selector */}
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter Session ID (e.g. A1B2C3)"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Analytics'}
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Total Gaze Points</p>
            <p className="text-3xl font-bold mt-1 text-blue-400">{vectors.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Avg. Buyer Proximity</p>
            <p className="text-3xl font-bold mt-1 text-emerald-400">{avgProximity}m</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Session Duration</p>
            <p className="text-3xl font-bold mt-1 text-purple-400">{sessionDuration}s</p>
          </div>
        </div>

        {/* 3D Heatmap Section */}
        {vectors.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">3D Engagement Heatmap</h2>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/60 inline-block" /> Low Gaze</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/60 inline-block" /> Med Gaze</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/60 inline-block" /> High Gaze</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/60 inline-block" /> Hotspot</span>
              </div>
            </div>

            <div className="aspect-video bg-gray-950 rounded-lg overflow-hidden relative border border-gray-800">
              <ModelViewerWrapper
                src={modelUrl}
                ar={false}
                interactive={true}
              />
              <HeatmapOverlay gazeData={vectors} width={900} height={500} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
