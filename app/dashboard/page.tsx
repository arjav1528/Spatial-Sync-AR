'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

function DashboardContent() {
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get('sessionId') || searchParams.get('session') || '';

  const [sessionId, setSessionId] = useState(querySessionId);
  const [vectors, setVectors] = useState<AnalyticsVector[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [modelUrl, setModelUrl] = useState('');

  const loadAnalyticsForSession = useCallback(async (targetSessionId: string) => {
    if (!targetSessionId.trim()) return;
    setLoading(true);
    try {
      const [analyticsRes, sessionRes] = await Promise.all([
        fetch(`/api/analytics?sessionId=${targetSessionId}`),
        fetch(`/api/session?id=${targetSessionId}`).catch(() => null),
      ]);

      const analyticsData = await analyticsRes.json();
      setVectors(analyticsData.vectors || []);

      if (sessionRes && sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.assetUrl || sessionData.session?.assetUrl) {
          setModelUrl(sessionData.assetUrl || sessionData.session?.assetUrl);
        } else if (sessionData.session?.assetKey) {
          setModelUrl(
            `https://${process.env.NEXT_PUBLIC_S3_BUCKET || ''}.s3.${
              process.env.NEXT_PUBLIC_AWS_REGION || 'eu-central-1'
            }.amazonaws.com/${sessionData.session.assetKey}`
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (querySessionId) {
      setSessionId(querySessionId);
      loadAnalyticsForSession(querySessionId);
    }
  }, [querySessionId, loadAnalyticsForSession]);

  const handleManualFetch = () => {
    loadAnalyticsForSession(sessionId);
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
    <main className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>

      {/* Session Selector */}
      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Enter Session ID (e.g. A1B2C3)"
          className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
        />
        <button
          onClick={handleManualFetch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer text-white"
        >
          {loading ? 'Loading...' : 'Load Analytics'}
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-xs">Total Gaze Points</p>
          <p className="text-2xl font-bold mt-1 text-white">{vectors.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-gray-400 text-xs">Avg. Buyer Proximity</p>
          <p className="text-2xl font-bold mt-1 text-white">{avgProximity}m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-gray-400 text-xs">Session Duration</p>
          <p className="text-2xl font-bold mt-1 text-white">{sessionDuration}s</p>
        </div>
      </div>

      {/* Empty State */}
      {hasLoaded && vectors.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-xs text-gray-400">
          No gaze data found for session <span className="font-mono text-white">"{sessionId}"</span>.
        </div>
      )}

      {/* 3D Heatmap Section */}
      {vectors.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-base font-bold text-white mb-4">3D Engagement Heatmap</h2>
          <div className="aspect-video bg-gray-950 rounded-lg overflow-hidden relative border border-gray-800">
            <ModelViewerWrapper
              src={modelUrl}
              ar={false}
              interactive={true}
            />
            <HeatmapOverlay gazeData={vectors} />
          </div>
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading Analytics...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
